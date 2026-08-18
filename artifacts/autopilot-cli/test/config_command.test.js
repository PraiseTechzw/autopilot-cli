const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const configCommand = require('../src/commands/config');
const { loadConfig } = require('../src/config/loader');

const tmpDir = path.join(require('os').tmpdir(), `autopilot-config-test-${Date.now()}`);
const originalCwd = process.cwd();

beforeEach(async () => {
  await fs.ensureDir(tmpDir);
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

test('Config Command', async (t) => {
  await t.test('should set and get a value', async () => {
    // Set a value
    await configCommand('set', 'ai.provider', 'grok', { cwd: tmpDir });
    
    // Verify file content
    const configPath = path.join(tmpDir, '.autopilotrc.json');
    const savedConfig = await fs.readJson(configPath);
    assert.strictEqual(savedConfig.ai.provider, 'grok');
    
    // Verify via loader
    const loaded = await loadConfig(tmpDir);
    assert.strictEqual(loaded.ai.provider, 'grok');
  });

  await t.test('should handle boolean values', async () => {
    await configCommand('set', 'autoPush', 'false', { cwd: tmpDir });
    
    const savedConfig = await fs.readJson(path.join(tmpDir, '.autopilotrc.json'));
    assert.strictEqual(savedConfig.autoPush, false);
  });

  await t.test('should handle number values', async () => {
    await configCommand('set', 'debounceSeconds', '10', { cwd: tmpDir });
    
    const savedConfig = await fs.readJson(path.join(tmpDir, '.autopilotrc.json'));
    assert.strictEqual(savedConfig.debounceSeconds, 10);
  });

  await t.test('should create nested objects if needed', async () => {
    await configCommand('set', 'new.nested.key', 'value', { cwd: tmpDir });
    
    const savedConfig = await fs.readJson(path.join(tmpDir, '.autopilotrc.json'));
    assert.strictEqual(savedConfig.new.nested.key, 'value');
  });

  await t.test('should not overwrite existing other keys', async () => {
    // Setup initial config
    await fs.writeJson(path.join(tmpDir, '.autopilotrc.json'), { existing: 'data' });
    
    await configCommand('set', 'newKey', 'newValue', { cwd: tmpDir });
    
    const savedConfig = await fs.readJson(path.join(tmpDir, '.autopilotrc.json'));
    assert.strictEqual(savedConfig.existing, 'data');
    assert.strictEqual(savedConfig.newKey, 'newValue');
  });
});
