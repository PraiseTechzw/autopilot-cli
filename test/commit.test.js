const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { generateCommitMessage } = require('../src/core/commit');

describe('Commit Message Generator', () => {
  it('should generate a feat: message for new source files', () => {
    const files = [
      { status: 'M', file: 'src/core/watcher.js' },
      { status: 'A', file: 'src/commands/start.js' }
    ];
    const msg = generateCommitMessage(files);
    assert.match(msg, /^feat(\(.*\))?: /);
  });

  it('should generate a fix: message for bug fixes', () => {
    const files = [{ status: 'M', file: 'src/fix-bug.js' }];
    const msg = generateCommitMessage(files);
    assert.match(msg, /^fix(\(.*\))?: /);
  });

  it('should generate a docs: message for documentation changes', () => {
    const files = [
      { status: 'M', file: 'README.md' },
      { status: 'A', file: 'docs/api.md' }
    ];
    const msg = generateCommitMessage(files);
    assert.match(msg, /^docs(\(.*\))?: /);
  });

  it('should generate a chore: message for config files', () => {
    const files = [
      { status: 'M', file: 'package.json' },
      { status: 'M', file: '.gitignore' }
    ];
    const msg = generateCommitMessage(files);
    assert.match(msg, /^chore(\(.*\))?: /);
  });

  it('should handle mixed file types with priority', () => {
    const files = [
      { status: 'M', file: 'src/index.js' },
      { status: 'M', file: 'README.md' }
    ];
    const msg = generateCommitMessage(files);
    // Source code usually takes precedence
    assert.match(msg, /^(feat|fix|refactor|update)(\(.*\))?: /);
  });
});
