const assert = require('node:assert');
const test = require('node:test');
const path = require('node:path');
const { loadConfig } = require('../src/config/loader');
const { DEFAULT_CONFIG } = require('../src/config/defaults');
const fs = require('fs-extra');

test('Config Loader', async (t) => {
  const tmpDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'autopilot-config-test-'));
  
  t.after(async () => {
    await fs.remove(tmpDir);
  });

  await t.test('should load default config when no file exists', async () => {
    const config = await loadConfig(tmpDir);
    assert.deepStrictEqual(config, DEFAULT_CONFIG);
  });

  await t.test('should merge user config with defaults', async () => {
    const userConfig = {
      debounceSeconds: 10,
      blockBranches: ['production']
    };
    await fs.writeJson(path.join(tmpDir, '.autopilotrc.json'), userConfig);
    
    const config = await loadConfig(tmpDir);
    assert.strictEqual(config.debounceSeconds, 10);
    assert.strictEqual(config.minSecondsBetweenCommits, DEFAULT_CONFIG.minSecondsBetweenCommits);
    assert.deepStrictEqual(config.blockBranches, ['production']);
  });
});
