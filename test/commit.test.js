const { test } = require('node:test');
const assert = require('node:assert');
const { generateCommitMessage } = require('../src/core/commit.js');

test('generateCommitMessage - empty or null input', () => {
  assert.strictEqual(generateCommitMessage([]), 'chore: update changes');
  assert.strictEqual(generateCommitMessage(null), 'chore: update changes');
  assert.strictEqual(generateCommitMessage(undefined), 'chore: update changes');
});

test('generateCommitMessage - fix priority', () => {
  // fix mixed with everything else should be fix
  const files = [
    'src/fix/bug.js',
    'src/feature.js',
    'README.md',
    'test/app.test.js',
    'package.json'
  ];
  assert.strictEqual(generateCommitMessage(files), 'fix: resolve issues');
});

test('generateCommitMessage - feat priority', () => {
  // feat mixed with docs, test, chore should be feat
  const files = [
    'src/feature.js',
    'README.md',
    'test/app.test.js',
    'package.json'
  ];
  assert.strictEqual(generateCommitMessage(files), 'feat: add new features');
});

test('generateCommitMessage - docs priority', () => {
  // docs mixed with test, chore should be docs
  const files = [
    'README.md',
    'test/app.test.js',
    'package.json'
  ];
  assert.strictEqual(generateCommitMessage(files), 'docs: update documentation');
});

test('generateCommitMessage - test priority', () => {
  // test mixed with chore should be test
  const files = [
    'test/app.test.js',
    'package.json'
  ];
  assert.strictEqual(generateCommitMessage(files), 'test: update tests');
});

test('generateCommitMessage - chore priority', () => {
  // chore only
  const files = [
    'package.json',
    '.gitignore'
  ];
  assert.strictEqual(generateCommitMessage(files), 'chore: update configuration');
});

test('generateCommitMessage - heuristics - fix', () => {
  assert.strictEqual(generateCommitMessage(['src/bugfix/login.js']), 'fix: resolve issues');
  assert.strictEqual(generateCommitMessage(['src/utils/error-handler.js']), 'fix: resolve issues');
});

test('generateCommitMessage - heuristics - feat', () => {
  assert.strictEqual(generateCommitMessage(['src/components/Button.js']), 'feat: add new features');
  assert.strictEqual(generateCommitMessage(['src/api/user.ts']), 'feat: add new features');
});

test('generateCommitMessage - heuristics - docs', () => {
  assert.strictEqual(generateCommitMessage(['docs/guide.md']), 'docs: update documentation');
  assert.strictEqual(generateCommitMessage(['CONTRIBUTING.txt']), 'docs: update documentation');
});

test('generateCommitMessage - heuristics - test', () => {
  assert.strictEqual(generateCommitMessage(['src/components/Button.test.js']), 'test: update tests');
  assert.strictEqual(generateCommitMessage(['src/__tests__/utils.js']), 'test: update tests');
});

test('generateCommitMessage - heuristics - chore', () => {
  assert.strictEqual(generateCommitMessage(['.github/workflows/ci.yml']), 'chore: update configuration');
  assert.strictEqual(generateCommitMessage(['eslint.config.js']), 'chore: update configuration');
});

test('generateCommitMessage - unknown files default to chore', () => {
  assert.strictEqual(generateCommitMessage(['random-file.unknown']), 'chore: update changes');
});

test('generateCommitMessage - mixed paths (windows backslashes)', () => {
  const files = ['src\\fix\\bug.js'];
  assert.strictEqual(generateCommitMessage(files), 'fix: resolve issues');
});
