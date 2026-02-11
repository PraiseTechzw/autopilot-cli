const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const logger = require('../src/utils/logger');

// Mock fetch globally
global.fetch = async () => {};

describe('AI Features Integration', () => {
  let gemini;
  let grok;
  let commit;

  beforeEach(() => {
    // Mock logger to suppress output during tests
    mock.method(logger, 'info', () => {});
    mock.method(logger, 'warn', () => {});
    mock.method(logger, 'error', () => {});

    // Re-require modules to ensure clean state
    delete require.cache[require.resolve('../src/core/gemini')];
    delete require.cache[require.resolve('../src/core/grok')];
    delete require.cache[require.resolve('../src/core/commit')];
    
    gemini = require('../src/core/gemini');
    grok = require('../src/core/grok');
    commit = require('../src/core/commit');
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('Grok AI Provider', () => {
    it('should generate commit message using Grok API', async () => {
      const mockResponse = {
        choices: [{
          message: { content: 'feat(grok): add support for xAI' }
        }]
      };

      mock.method(global, 'fetch', (url, options) => {
        assert.match(url, /api\.x\.ai/);
        assert.strictEqual(options.method, 'POST');
        assert.match(options.headers.Authorization, /Bearer test-key/);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });
      });

      const msg = await grok.generateGrokCommitMessage('diff content', 'test-key');
      assert.strictEqual(msg, 'feat(grok): add support for xAI');
    });

    it('should strip markdown code blocks from Grok response', async () => {
      const mockResponse = {
        choices: [{
          message: { content: '```\nfix: bug in grok\n```' }
        }]
      };

      mock.method(global, 'fetch', () => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const msg = await grok.generateGrokCommitMessage('diff', 'key');
      assert.strictEqual(msg, 'fix: bug in grok');
    });

    it('should handle Grok API errors gracefully', async () => {
      mock.method(global, 'fetch', () => Promise.resolve({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'invalid key' })
      }));

      await assert.rejects(
        async () => await grok.generateGrokCommitMessage('diff', 'key'),
        /Grok API Error: 401/
      );
    });

    it('should validate Grok API key', async () => {
      mock.method(global, 'fetch', () => Promise.resolve({ ok: true }));
      const result = await grok.validateGrokApiKey('good-key');
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Commit Command Integration', () => {
    it('should use Gemini when provider is gemini', async () => {
      const config = {
        commitMessageMode: 'ai',
        ai: {
          enabled: true,
          provider: 'gemini',
          apiKey: 'gemini-key'
        }
      };

      // Mock Gemini generation
      mock.method(gemini, 'generateAICommitMessage', async () => 'feat: gemini message');
      // Mock Grok generation to ensure it's NOT called
      mock.method(grok, 'generateGrokCommitMessage', async () => 'feat: grok message');

      const msg = await commit.generateCommitMessage([{ status: 'M', file: 'test.js' }], 'diff', config);
      assert.strictEqual(msg, '[autopilot] feat: gemini message');
    });

    it('should use Grok when provider is grok', async () => {
      const config = {
        commitMessageMode: 'ai',
        ai: {
          enabled: true,
          provider: 'grok',
          grokApiKey: 'grok-key'
        }
      };

      // Mock Gemini generation to ensure it's NOT called
      mock.method(gemini, 'generateAICommitMessage', async () => 'feat: gemini message');
      // Mock Grok generation
      mock.method(grok, 'generateGrokCommitMessage', async () => 'feat: grok message');

      const msg = await commit.generateCommitMessage([{ status: 'M', file: 'test.js' }], 'diff', config);
      assert.strictEqual(msg, '[autopilot] feat: grok message');
    });

    it('should default to Grok if provider is missing', async () => {
      const config = {
        commitMessageMode: 'ai',
        ai: {
          enabled: true,
          // no provider specified
        }
      };

      mock.method(grok, 'generateGrokCommitMessage', async () => 'feat: default grok');

      const msg = await commit.generateCommitMessage([{ status: 'M', file: 'test.js' }], 'diff', config);
      assert.strictEqual(msg, '[autopilot] feat: default grok');
    });


    it('should fallback to smart commit if AI fails', async () => {
      const config = {
        commitMessageMode: 'ai',
        ai: {
          enabled: true,
          provider: 'gemini',
          apiKey: 'gemini-key'
        }
      };

      // Mock Gemini to fail
      mock.method(gemini, 'generateAICommitMessage', async () => {
        throw new Error('API Error');
      });

      // We need to mock parseDiff/determineContext/etc internal to commit.js if they weren't exported.
      // Since generateSmartCommitMessage is internal, we rely on its output.
      // However, commit.js has generateSmartCommitMessage logic inside.
      // Let's verify it returns a message that DOES NOT start with 'feat: gemini' but follows smart logic.
      
      const msg = await commit.generateCommitMessage([{ status: 'M', file: 'test.js' }], 'diff', config);
      // Smart commit message logic: "chore: update changes" or analyzed one.
      // With 'diff' string as just 'diff', parseDiff might fail or return empty.
      // Let's provide a valid diff to ensure smart logic works or just check it's not empty.
      assert.ok(msg.startsWith('[autopilot]'));
      assert.doesNotMatch(msg, /gemini message/);
    });
  });
});
