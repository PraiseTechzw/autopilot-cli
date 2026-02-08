const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const logger = require('../src/utils/logger');

// Set env var BEFORE requiring modules that use it
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'autopilot-e2e-'));
const HOME_DIR = path.join(TMP_ROOT, 'home');
const REPO_DIR = path.join(TMP_ROOT, 'repo');
const REMOTE_DIR = path.join(TMP_ROOT, 'remote.git');

process.env.AUTOPILOT_CONFIG_DIR = path.join(HOME_DIR, '.autopilot');
// process.env.AUTOPILOT_TEST_MODE = '1'; // Disable to prevent process.exit()

// Require modules under test
const Watcher = require('../src/core/watcher');
const git = require('../src/core/git');
const gemini = require('../src/core/gemini');
const eventSystem = require('../src/core/events');

// Mock fetch globally
global.fetch = async () => {};

describe('Full System E2E Integration', () => {
  
  beforeEach(async () => {
    // Clean start
    await fs.emptyDir(TMP_ROOT);
    await fs.ensureDir(HOME_DIR);
    await fs.ensureDir(REPO_DIR);
    await fs.ensureDir(REMOTE_DIR);

    // Setup Remote (Bare)
    spawnSync('git', ['init', '--bare'], { cwd: REMOTE_DIR });

    // Setup Repo
    spawnSync('git', ['init'], { cwd: REPO_DIR });
    spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: REPO_DIR });
    spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: REPO_DIR });
    spawnSync('git', ['remote', 'add', 'origin', REMOTE_DIR], { cwd: REPO_DIR });
    
    // Initial Commit
    await fs.writeFile(path.join(REPO_DIR, 'README.md'), '# Init');
    spawnSync('git', ['add', '.'], { cwd: REPO_DIR });
    spawnSync('git', ['commit', '-m', 'Initial'], { cwd: REPO_DIR });
    spawnSync('git', ['push', '-u', 'origin', 'master'], { cwd: REPO_DIR }); // Push initial to set upstream

    // Setup Global Config
    const configDir = process.env.AUTOPILOT_CONFIG_DIR;
    await fs.ensureDir(configDir);
    await fs.writeJson(path.join(configDir, 'config.json'), {
      autoPush: true, 
      debounceSeconds: 1, // Fast debounce
      minSecondsBetweenCommits: 0,
      commitMessageMode: 'ai', // <--- REQUIRED for AI generation
      ai: {
        enabled: true,
        provider: 'gemini',
        apiKey: 'test-gemini-key'
      }
    });

    // Mock AI Generation
    mock.method(global, 'fetch', async (url) => {
      return {
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'feat: e2e test change' }]
            }
          }]
        })
      };
    });
  });

  afterEach(async () => {
    mock.restoreAll();
    try {
        // Cleanup if needed
        // await fs.remove(TMP_ROOT); 
    } catch (e) {}
  });

  it('should flow from Global Config -> Watcher -> AI Commit -> Trust Trailers -> Push -> Event', async () => {
    const watcher = new Watcher(REPO_DIR);
    
    // Enable debug logging
    watcher.logVerbose = (msg) => console.log(`[Watcher] ${msg}`);
    mock.method(logger, 'info', (msg) => console.log(`[Info] ${msg}`));
    mock.method(logger, 'success', (msg) => console.log(`[Success] ${msg}`));
    mock.method(logger, 'warn', (msg) => console.log(`[Warn] ${msg}`));
    mock.method(logger, 'error', (msg) => console.log(`[Error] ${msg}`));
    mock.method(logger, 'debug', (msg) => console.log(`[Debug] ${msg}`));

    // Capture events
     const emittedEvents = [];
     mock.method(eventSystem, 'sendToBackend', async (event) => {
         console.log('[Mock] sendToBackend called');
         emittedEvents.push(event);
         return true; // Simulate success
     });

     // Start Watcher
     await watcher.start();

    // Verify Config Loaded
    assert.strictEqual(watcher.config.ai.provider, 'gemini', 'Should load global config');
    assert.strictEqual(watcher.config.debounceSeconds, 1, 'Should load fast debounce');

    // Wait for Chokidar to settle
    console.log('Waiting for watcher to settle...');
    await new Promise(r => setTimeout(r, 2000));

    // Make Change
    console.log('Writing test file...');
    // Verify Config Loaded
     assert.strictEqual(watcher.config.ai.provider, 'gemini', 'Should load global config');
     assert.strictEqual(watcher.config.debounceSeconds, 1, 'Should load fast debounce');

     // Trigger Change
     console.log('Writing test file...');
     await fs.writeFile(path.join(REPO_DIR, 'test.txt'), 'test change');

    // Wait for Event Emission (Push Success)
    console.log('Waiting for push_success event...');
    await new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
            if (emittedEvents.some(e => e.type === 'push_success')) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 500);
        
        // Timeout after 30s
        setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('Timed out waiting for push_success event'));
        }, 30000);
    });

    // Stop watcher
    await watcher.stop();

    // --- VERIFICATION ---
    
    // 1. Check Commit Message (AI)
    const log = spawnSync('git', ['log', '-1', '--pretty=%B'], { cwd: REPO_DIR }).stdout.toString();
    assert.match(log, /feat: e2e test change/, 'Commit message should be AI generated');

    // 2. Check Trust Trailers
    assert.match(log, /Autopilot-Commit: true/, 'Should have Autopilot-Commit trailer');
    assert.match(log, /Autopilot-User:/, 'Should have Autopilot-User trailer');
    assert.match(log, /Autopilot-Signature:/, 'Should have Autopilot-Signature trailer');

    // 3. Check Event Emission
    assert.ok(emittedEvents.length > 0, 'Should have emitted events');
    const pushEvent = emittedEvents.find(e => e.type === 'push_success');
    assert.ok(pushEvent, 'Should have a push_success event');
    assert.ok(pushEvent.commitHash, 'Event should have commit hash');
    assert.ok(pushEvent.userId, 'Event should have user ID');
  });

});
