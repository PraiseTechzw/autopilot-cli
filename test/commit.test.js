/**
 * Unit tests for smart commit message generator
 * Built by Praise Masunga (PraiseTechzw)
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { generateCommitMessage } = require('../src/core/commit.js');

test('generateCommitMessage - empty array returns default', () => {
  const result = generateCommitMessage([]);
  assert.strictEqual(result, 'chore: update changes');
});

test('generateCommitMessage - null/undefined returns default', () => {
  assert.strictEqual(generateCommitMessage(null), 'chore: update changes');
  assert.strictEqual(generateCommitMessage(undefined), 'chore: update changes');
});

test('generateCommitMessage - docs only', () => {
  const files = ['README.md', 'docs/guide.md'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'docs: update documentation');
});

test('generateCommitMessage - docs with .txt', () => {
  const files = ['notes.txt', 'LICENSE.txt'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'docs: update documentation');
});

test('generateCommitMessage - tests only', () => {
  const files = ['src/utils.test.js', 'src/helper.spec.ts'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'test: update tests');
});

test('generateCommitMessage - tests in __tests__ directory', () => {
  const files = ['__tests__/utils.js', 'src/__tests__/helper.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'test: update tests');
});

test('generateCommitMessage - config files only', () => {
  const files = ['package.json', 'tsconfig.json', '.github/workflows/ci.yml'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'chore: update configuration');
});

test('generateCommitMessage - yaml config files', () => {
  const files = ['config.yml', 'settings.yaml'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'chore: update configuration');
});

test('generateCommitMessage - src changes (feat)', () => {
  const files = ['src/index.js', 'src/utils/helper.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'feat: add new features');
});

test('generateCommitMessage - src with backslashes (Windows paths)', () => {
  const files = ['src\\index.js', 'src\\utils\\helper.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'feat: add new features');
});

test('generateCommitMessage - fix in path', () => {
  const files = ['src/fix/issue-123.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'fix: resolve issues');
});

test('generateCommitMessage - fix in filename', () => {
  const files = ['src/fix-auth-bug.js', 'lib/bugfix-session.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'fix: resolve issues');
});

test('generateCommitMessage - hotfix pattern', () => {
  const files = ['src/hotfix-critical.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'fix: resolve issues');
});

test('generateCommitMessage - error handler files', () => {
  const files = ['src/error.js', 'lib/exception.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'fix: resolve issues');
});

test('generateCommitMessage - priority: fix over feat', () => {
  const files = ['src/feature.js', 'src/fix/bug.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'fix: resolve issues');
});

test('generateCommitMessage - priority: fix over docs', () => {
  const files = ['README.md', 'src/bugfix.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'fix: resolve issues');
});

test('generateCommitMessage - priority: feat over docs', () => {
  const files = ['README.md', 'src/index.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'feat: add new features');
});

test('generateCommitMessage - priority: feat over test', () => {
  const files = ['src/index.js', 'src/index.test.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'feat: add new features');
});

test('generateCommitMessage - priority: docs over test', () => {
  const files = ['README.md', 'src/utils.test.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'docs: update documentation');
});

test('generateCommitMessage - priority: test over chore', () => {
  const files = ['package.json', 'src/utils.test.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'test: update tests');
});

test('generateCommitMessage - chore for other files', () => {
  const files = ['random.txt.backup', 'public/image.png'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'chore: update configuration');
});

test('generateCommitMessage - deterministic (same input = same output)', () => {
  const files = ['src/index.js', 'README.md', 'package.json'];
  const result1 = generateCommitMessage(files);
  const result2 = generateCommitMessage(files);
  const result3 = generateCommitMessage(files);
  
  assert.strictEqual(result1, result2);
  assert.strictEqual(result2, result3);
  assert.strictEqual(result1, 'feat: add new features');
});

test('generateCommitMessage - config.js files', () => {
  const files = ['webpack.config.js', 'jest.config.ts'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'chore: update configuration');
});

test('generateCommitMessage - mixed src and tests (feat wins)', () => {
  const files = ['src/utils.js', 'src/utils.test.js', 'src/helper.js'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'feat: add new features');
});

test('generateCommitMessage - case insensitive matching', () => {
  const files = ['SRC/Index.JS', 'README.MD'];
  const result = generateCommitMessage(files);
  assert.strictEqual(result, 'feat: add new features');
});
