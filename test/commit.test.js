const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { generateCommitMessage } = require('../src/core/commit');

describe('Commit Message Generator', () => {
  it('should generate a feat: message for new source files', async () => {
    const files = [
      { status: 'M', file: 'src/core/watcher.js' },
      { status: 'A', file: 'src/commands/start.js' }
    ];
    const msg = await generateCommitMessage(files);
    assert.match(msg, /^\[autopilot\] feat(\(.*\))?: /);
  });

  it('should generate a fix: message for bug fixes', async () => {
    const files = [{ status: 'M', file: 'src/fix-bug.js' }];
    const msg = await generateCommitMessage(files);
    assert.match(msg, /^\[autopilot\] fix(\(.*\))?: /);
  });

  it('should generate a docs: message for documentation changes', async () => {
    const files = [
      { status: 'M', file: 'README.md' },
      { status: 'A', file: 'docs/api.md' }
    ];
    const msg = await generateCommitMessage(files);
    assert.match(msg, /^\[autopilot\] docs(\(.*\))?: /);
  });

  it('should generate a chore: message for config files', async () => {
    const files = [
      { status: 'M', file: 'package.json' },
      { status: 'M', file: '.gitignore' }
    ];
    const msg = await generateCommitMessage(files);
    assert.match(msg, /^\[autopilot\] chore(\(.*\))?: /);
  });

  it('should handle mixed file types with priority', async () => {
    const files = [
      { status: 'M', file: 'src/index.js' },
      { status: 'M', file: 'README.md' }
    ];
    const msg = await generateCommitMessage(files);
    // Source code usually takes precedence
    assert.match(msg, /^\[autopilot\] (feat|fix|refactor|update)(\(.*\))?: /);
  });
});
