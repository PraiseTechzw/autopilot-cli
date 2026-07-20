const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const configCommand = require('../src/commands/config');
const { loadConfig } = require('../src/config/loader');

const tmpDir = path.join(os.tmpdir(), `autopilot-global-test-${Date.now()}`);
const mockHome = path.join(tmpDir, 'home');
const mockRepo = path.join(tmpDir, 'repo');

beforeEach(async () => {
  await fs.ensureDir(mockHome);
  await fs.ensureDir(mockRepo);
  process.env.AUTOPILOT_CONFIG_DIR = path.join(mockHome, '.autopilot');
});

afterEach(async () => {
  delete process.env.AUTOPILOT_CONFIG_DIR;
  await fs.remove(tmpDir);
});

test('Global Config', async (t) => {
  await t.test('should set global config value', async () => {
    // Set global value
    await configCommand('set', 'ai.provider', 'gemini', { global: true, cwd: mockRepo });
    
    // Verify file content in ~/.autopilot/config.json
    const globalConfigPath = path.join(mockHome, '.autopilot', 'config.json');
    const savedConfig = await fs.readJson(globalConfigPath);
    assert.strictEqual(savedConfig.ai.provider, 'gemini');
    
    // Verify local config does NOT exist
    const localConfigPath = path.join(mockRepo, '.autopilotrc.json');
    assert.strictEqual(await fs.pathExists(localConfigPath), false);
  });

  await t.test('should be overridden by local config', async () => {
    // Set global
    await configCommand('set', 'ai.provider', 'gemini', { global: true, cwd: mockRepo });
    
    // Set local
    await configCommand('set', 'ai.provider', 'grok', { cwd: mockRepo });
    
    // Verify loader prefers local
    const config = await loadConfig(mockRepo);
    assert.strictEqual(config.ai.provider, 'grok');
  });

  await t.test('should fallback to global config if local missing', async () => {
    // Set global
    await configCommand('set', 'ai.provider', 'gemini', { global: true, cwd: mockRepo });
    
    // Verify loader uses global
    const config = await loadConfig(mockRepo);
    assert.strictEqual(config.ai.provider, 'gemini');
  });
});
