const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateCommitMessage } = require('../src/core/commit');
const openrouter = require('../src/core/openrouter');

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

  it('should use OpenRouter when configured for AI commit generation', async () => {
    mock.method(openrouter, 'generateCommitMessage', async () => 'feat: add openrouter support');

    const files = [{ status: 'M', file: 'src/core/commit.js' }];
    const msg = await generateCommitMessage(files, 'diff --git a/src/core/commit.js b/src/core/commit.js\n+const value = 1;', {
      ai: {
        provider: 'openrouter',
        apiKey: 'test-key',
        enabled: true
      }
    });

    assert.strictEqual(msg, '[autopilot] feat: add openrouter support');
  });

  it('should use OpenRouter by default when AI is enabled and a key is available', async () => {
    mock.restoreAll();

    const originalFetch = global.fetch;
    let fetchCalled = false;

    global.fetch = async (_url, options) => {
      fetchCalled = true;
      const payload = JSON.parse(options.body);
      assert.strictEqual(payload.model, 'openai/gpt-oss-120b:free');
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'feat: use openrouter by default' } }]
        })
      };
    };

    try {
      const files = [{ status: 'M', file: 'src/core/commit.js' }];
      const msg = await generateCommitMessage(files, 'diff --git a/src/core/commit.js b/src/core/commit.js\n+const value = 1;', {
        ai: {
          enabled: true,
          apiKey: 'test-key'
        }
      });

      assert.strictEqual(msg, '[autopilot] feat: use openrouter by default');
      assert.strictEqual(fetchCalled, true);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should read the API key from a local .env file when no key is passed explicitly', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autopilot-openrouter-'));
    const originalCwd = process.cwd();
    fs.writeFileSync(path.join(tempDir, '.env'), 'OPENROUTER_API_KEY=test-from-env\n');
    process.chdir(tempDir);

    try {
      assert.strictEqual(openrouter.resolveApiKey(''), 'test-from-env');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should try multiple free OpenRouter models until one succeeds', async () => {
    mock.restoreAll();

    const originalFetch = global.fetch;
    const attemptedModels = [];

    global.fetch = async (_url, options) => {
      const payload = JSON.parse(options.body);
      attemptedModels.push(payload.model);

      if (attemptedModels.length === 1) {
        return {
          ok: false,
          status: 429,
          text: async () => 'rate limited'
        };
      }

      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'feat: add fallback support' } }]
        })
      };
    };

    try {
      const result = await openrouter.generateCommitMessage('diff --git a/src/core/commit.js b/src/core/commit.js\n+const value = 1;', 'test-key');
      assert.strictEqual(result, 'feat: add fallback support');
      assert.deepStrictEqual(attemptedModels.slice(0, 2), [
        'openai/gpt-oss-120b:free',
        'openrouter/free'
      ]);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
