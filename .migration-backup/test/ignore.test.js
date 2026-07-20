const assert = require('node:assert');
const test = require('node:test');
const path = require('node:path');
const { createIgnoredFilter, normalizePath } = require('../src/config/ignore');

test('Ignore Logic', async (t) => {
  await t.test('normalizePath should convert backslashes to forward slashes', () => {
    assert.strictEqual(normalizePath('path\\to\\file'), 'path/to/file');
    assert.strictEqual(normalizePath('C:\\path\\to\\file'), 'C:/path/to/file');
  });

  await t.test('createIgnoredFilter should ignore critical files', () => {
    const repoPath = 'C:\\Users\\Project';
    const filter = createIgnoredFilter(repoPath, []);

    // Helper to simulate absolute paths on Windows
    const getPath = (rel) => path.join(repoPath, rel);

    // Critical ignores
    assert.strictEqual(filter(getPath('.git\\HEAD')), true, 'Should ignore .git');
    assert.strictEqual(filter(getPath('node_modules\\pkg\\index.js')), true, 'Should ignore node_modules');
    assert.strictEqual(filter(getPath('.vscode\\settings.json')), true, 'Should ignore .vscode');
    assert.strictEqual(filter(getPath('.vscode\\time-analytics.json')), true, 'Should ignore time-analytics.json');
    assert.strictEqual(filter(getPath('autopilot.log')), true, 'Should ignore autopilot.log');
    assert.strictEqual(filter(getPath('.autopilot.pid')), true, 'Should ignore .autopilot.pid');
    
    // Normal files
    assert.strictEqual(filter(getPath('src\\index.js')), false, 'Should not ignore src files');
    assert.strictEqual(filter(getPath('README.md')), false, 'Should not ignore README.md');
  });

  await t.test('createIgnoredFilter should handle repo-relative paths correctly', () => {
    const repoPath = '/Users/Project';
    const filter = createIgnoredFilter(repoPath, ['*.tmp']);

    assert.strictEqual(filter('/Users/Project/file.tmp'), true, 'Should ignore custom pattern');
    assert.strictEqual(filter('/Users/Project/src/file.js'), false, 'Should not ignore valid file');
  });
});
