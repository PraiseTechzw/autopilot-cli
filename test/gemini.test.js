const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

// Mock fetch globally
global.fetch = async () => {};

describe('Gemini AI Integration', () => {
  let gemini;
  
  beforeEach(() => {
    gemini = require('../src/core/gemini');
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should generate commit message from diff', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'feat(core): add AI capabilities' }]
        }
      }]
    };

    mock.method(global, 'fetch', () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));

    const msg = await gemini.generateAICommitMessage('diff content', 'fake-key');
    assert.strictEqual(msg, 'feat(core): add AI capabilities');
  });

  it('should strip markdown code blocks', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: '```\nfix: bug\n```' }]
        }
      }]
    };

    mock.method(global, 'fetch', () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));

    const msg = await gemini.generateAICommitMessage('diff', 'key');
    assert.strictEqual(msg, 'fix: bug');
  });

  it('should handle API errors gracefully', async () => {
    mock.method(global, 'fetch', () => Promise.resolve({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ error: 'invalid key' })
    }));

    await assert.rejects(
      async () => await gemini.generateAICommitMessage('diff', 'key'),
      /Gemini API Error: 400/
    );
  });

  it('should validate api key', async () => {
    mock.method(global, 'fetch', () => Promise.resolve({ ok: true }));
    const isValid = await gemini.validateApiKey('good-key');
    assert.strictEqual(isValid, true);
  });

  it('should reject invalid api key', async () => {
    mock.method(global, 'fetch', () => Promise.resolve({ ok: false }));
    const isValid = await gemini.validateApiKey('bad-key');
    assert.strictEqual(isValid, false);
  });
});
