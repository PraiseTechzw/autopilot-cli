const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const logger = require('../src/utils/logger');

// Mock fetch globally
global.fetch = async () => {};

describe('Grok AI Integration', () => {
  let grok;
  
  beforeEach(() => {
    mock.method(logger, 'error', () => {});
    grok = require('../src/core/grok');
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it('should generate commit message from diff', async () => {
    const mockResponse = {
      choices: [{
        message: { content: 'feat(core): add Grok support' }
      }]
    };

    mock.method(global, 'fetch', () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));

    const msg = await grok.generateGrokCommitMessage('diff content', 'fake-key');
    assert.strictEqual(msg, 'feat(core): add Grok support');
  });

  it('should strip markdown code blocks', async () => {
    const mockResponse = {
      choices: [{
        message: { content: '```\nfix: bug\n```' }
      }]
    };

    mock.method(global, 'fetch', () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }));

    const msg = await grok.generateGrokCommitMessage('diff', 'key');
    assert.strictEqual(msg, 'fix: bug');
  });

  it('should handle API errors gracefully', async () => {
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

  it('should validate api key', async () => {
    mock.method(global, 'fetch', () => Promise.resolve({ ok: true }));
    const result = await grok.validateGrokApiKey('good-key');
    assert.strictEqual(result.valid, true);
  });

  it('should reject invalid api key', async () => {
    mock.method(global, 'fetch', () => Promise.resolve({ 
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: { message: 'Invalid API Key' } })
    }));
    const result = await grok.validateGrokApiKey('bad-key');
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /Status: 403/);
  });
});
