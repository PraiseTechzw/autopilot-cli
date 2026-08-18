const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const presetCommand = require('../src/commands/preset');

// Mock logger
const logger = require('../src/utils/logger');
logger.section = () => {};
logger.success = () => {};
logger.info = () => {};
logger.error = () => {};

describe('Preset Command', () => {
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'autopilot-test-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  it('should list presets', async () => {
    // Just verify it doesn't crash
    await presetCommand('list');
  });

  it('should fail if preset not found', async () => {
    await presetCommand('apply', 'non-existent');
    const configExists = await fs.pathExists(path.join(tempDir, '.autopilotrc.json'));
    assert.strictEqual(configExists, false);
  });

  it('should apply "safe-team" preset', async () => {
    await presetCommand('apply', 'safe-team');
    
    const config = await fs.readJson(path.join(tempDir, '.autopilotrc.json'));
    assert.strictEqual(config.teamMode, true);
    assert.strictEqual(config.pullBeforePush, true);
    assert.strictEqual(config.preventSecrets, true);
  });

  it('should apply "solo-speed" preset', async () => {
    await presetCommand('apply', 'solo-speed');
    
    const config = await fs.readJson(path.join(tempDir, '.autopilotrc.json'));
    assert.strictEqual(config.teamMode, false);
    assert.strictEqual(config.debounceSeconds, 5);
    assert.strictEqual(config.commitMessageMode, 'simple');
  });

  it('should merge with existing config', async () => {
    // Create existing config
    await fs.writeJson(path.join(tempDir, '.autopilotrc.json'), {
      existingKey: 'value',
      debounceSeconds: 100
    });

    await presetCommand('apply', 'solo-speed');
    
    const config = await fs.readJson(path.join(tempDir, '.autopilotrc.json'));
    assert.strictEqual(config.existingKey, 'value'); // Preserved
    assert.strictEqual(config.debounceSeconds, 5); // Overwritten
  });
});
