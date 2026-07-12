const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const initRepo = require('../src/commands/init');
const gemini = require('../src/core/gemini');
const grok = require('../src/core/grok');
const logger = require('../src/utils/logger');

// Mock dependencies - moved to beforeEach to survive restoreAll
// mock.method calls removed from here

let gitRepoExists = true;

describe('Init Command AI Configuration', () => {
  let answers = [];
  
  const tmpDir = path.join(require('os').tmpdir(), `autopilot-init-test-${Date.now()}`);

  beforeEach(() => {
    // Reset answers
    answers = [];
    
    // Mock fs
    mock.method(fs, 'existsSync', (p) => {
      const str = String(p); // Ensure string
      if (str.endsWith('.git')) {
        return gitRepoExists;
      }
      return false;
    });
    mock.method(fs, 'writeFile', () => Promise.resolve());
    mock.method(fs, 'writeJson', () => Promise.resolve());
    mock.method(fs, 'readFile', () => Promise.resolve(''));
    mock.method(fs, 'ensureFile', () => Promise.resolve());
    mock.method(fs, 'pathExists', () => Promise.resolve(true));

    // Mock logger
    mock.method(logger, 'info', () => {});
    mock.method(logger, 'success', () => {});
    mock.method(logger, 'warn', () => {});
    mock.method(logger, 'error', () => {});
    mock.method(logger, 'section', () => {});

    // Mock validators
    mock.method(gemini, 'validateApiKey', () => Promise.resolve({ valid: true }));
    mock.method(grok, 'validateGrokApiKey', () => Promise.resolve({ valid: true }));
    
    // Ensure tmpDir exists
     if (!require('fs').existsSync(tmpDir)) {
       require('fs').mkdirSync(tmpDir, { recursive: true });
     }
     
     // Mock process.cwd
    mock.method(process, 'cwd', () => tmpDir);

    // Mock TTY
    process.stdin.isTTY = true;

    // Mock readline
    mock.method(readline, 'createInterface', () => ({
      question: (q, cb) => {
        const remaining = answers.length;
        const ans = answers.shift() || '';
        console.error(`DEBUG: Question: "${q}" -> Answer: "${ans}" (Remaining: ${remaining})`);
        cb(ans);
      },
      close: () => {}
    }));
    
    // Mock process.exit
    mock.method(process, 'exit', () => {});
    
    // Mock fs.writeJson to capture config
    mock.method(fs, 'writeJson', async (file, config) => {
      global.capturedConfig = config;
    });
    
    // Ensure tmpDir exists (conceptually)
    gitRepoExists = true;
});

  afterEach(() => {
    mock.restoreAll();
    delete global.capturedConfig;
  });

  it('should store a custom API key when selected', async () => {
    // Answers:
    // 1. Team mode? N
    // 2. Custom AI selection? 2
    // 3. API Key? test-gemini-key
    // 4. Interactive? y
    answers = ['N', '2', 'test-gemini-key', 'y'];
    
    await initRepo();
    
    const config = global.capturedConfig;
    assert.ok(config);
    assert.strictEqual(config.ai.enabled, true);
    assert.strictEqual(config.ai.provider, 'default');
    assert.strictEqual(config.ai.apiKey, 'test-gemini-key');
    assert.strictEqual(config.ai.interactive, true);
  });

  it('should keep custom API key setup simple', async () => {
    // Answers:
    // 1. Team mode? N
    // 2. Custom AI selection? 2
    // 3. API Key? test-grok-key
    // 4. Interactive? n
    answers = ['N', '2', 'test-grok-key', 'n'];
    
    await initRepo();
    
    const config = global.capturedConfig;
    assert.ok(config);
    assert.strictEqual(config.ai.enabled, true);
    assert.strictEqual(config.ai.provider, 'default');
    assert.strictEqual(config.ai.apiKey, 'test-grok-key');
    assert.strictEqual(config.ai.interactive, false);
    assert.strictEqual(config.ai.model, 'default');
  });

  it('should use Zero-Config AI by default', async () => {
    // Answers:
    // 1. Team mode? N
    // 2. Custom AI? N
    answers = ['N', 'N'];
    
    await initRepo();
    
    const config = global.capturedConfig;
    assert.ok(config);
    assert.strictEqual(config.ai.enabled, true);
    assert.strictEqual(config.ai.provider, 'default');
    assert.strictEqual(config.ai.apiKey, '');
    assert.strictEqual(config.ai.interactive, true); // Default is now true (Safety Mode)
  });

  it('should allow beginners to skip AI setup for now', async () => {
    answers = ['N', '3'];

    await initRepo();

    const config = global.capturedConfig;
    assert.ok(config);
    assert.strictEqual(config.ai.enabled, false);
    assert.strictEqual(config.ai.provider, 'default');
    assert.strictEqual(config.ai.apiKey, '');
  });

  it('should offer to initialize git when starting from a new folder', async () => {
    gitRepoExists = false;
    answers = ['y', 'N', 'N'];

    await initRepo();

    const config = global.capturedConfig;
    assert.ok(config);
    assert.strictEqual(config.ai.provider, 'default');
    assert.strictEqual(config.teamMode, false);
  });

});
