const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

// Set env var BEFORE requiring modules that use it
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'autopilot-e2e-'));
const HOME_DIR = path.join(TMP_ROOT, 'home');
const REPO_DIR = path.join(TMP_ROOT, 'repo');
const REMOTE_DIR = path.join(TMP_ROOT, 'remote.git');

process.env.AUTOPILOT_CONFIG_DIR = path.join(HOME_DIR, '.autopilot');
process.env.AUTOPILOT_TEST_MODE = '1';

// Require modules under test
const Watcher = require('../src/core/watcher');
const git = require('../src/core/git');
const gemini = require('../src/core/gemini');

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
      autoPush: true, // Enable push for event test
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
    // await fs.remove(TMP_ROOT); // Keep for debugging if failed
  });

  it('should flow from Global Config -> Watcher -> AI Commit -> Trust Trailers -> Push -> Event', async () => {
    const watcher = new Watcher(REPO_DIR);

    // Override config delays for speed
    watcher.config = {
      ...watcher.config,
      debounceSeconds: 0.1,
      minSecondsBetweenCommits: 0
    };

    // Start Watcher
    await watcher.start();

    // Verify Config Loaded
    assert.strictEqual(watcher.config.ai.provider, 'gemini', 'Should load global config');

    // Make Change
    await fs.writeFile(path.join(REPO_DIR, 'test.txt'), 'content');

    // Manually trigger processing to wait for it (Watcher is async/event-based)
    // We wait for watcher to pick it up.
    
    // Wait for debounce and processing
    await new Promise(r => setTimeout(r, 2000));

    // Stop watcher to flush anything
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
    const queuePath = path.join(process.env.AUTOPILOT_CONFIG_DIR, 'events-queue.json');
    assert.ok(await fs.pathExists(queuePath), 'Event queue file should exist');
    
    const queue = await fs.readJson(queuePath);
    const pushEvent = queue.find(e => e.type === 'push_success');
    assert.ok(pushEvent, 'Should have a push_success event');
    assert.ok(pushEvent.commitHash, 'Event should have commit hash');
    assert.ok(pushEvent.userId, 'Event should have user ID');
  });

});
