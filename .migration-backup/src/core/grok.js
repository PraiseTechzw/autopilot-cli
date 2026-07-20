const logger = require('../utils/logger');
const keys = require('./keys');

// Resolve fetch at call-time so test mocks can override it
function getFetch() {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch;
  }
  return (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_GROK_MODEL = 'grok-beta';
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Generate a commit message using Grok (or Groq) API with automatic failover
 * @param {string} diff - The git diff content
 * @param {string} [customApiKey] - Optional user-provided API Key
 * @param {string} [model] - Model ID
 * @returns {Promise<string>} Generated commit message
 */
async function generateGrokCommitMessage(diff, customApiKey, model) {
  if (!diff || !diff.trim()) return 'chore: update changes';

  // If a custom key is provided, use it directly
  if (customApiKey) {
    return executeRequest(diff, customApiKey, model);
  }

  // System Key Logic with Failover
  let attempts = 0;
  const maxAttempts = keys.keyCount;

  while (attempts < maxAttempts) {
    const currentKey = keys.getSystemKey();

    if (!currentKey || currentKey.includes('placeholder')) {
      throw new Error('No valid system AI keys configured.');
    }

    try {
      return await executeRequest(diff, currentKey, model);
    } catch (error) {
      const msg = String(error?.message || error);
      const isRateLimit = msg.includes(' 429') || msg.includes('429');
      const isInvalid = msg.includes(' 401') || msg.includes('401') || msg.includes(' 403') || msg.includes('403');

      if (isRateLimit || isInvalid) {
        keys.markKeyAsFailed(currentKey);
        attempts++;
        logger.info(`Attempt ${attempts}/${maxAttempts} failed. Trying next key...`);
        continue;
      }

      throw error;
    }
  }

  throw new Error('All internal AI keys exhausted or rate-limited.');
}

/**
 * Internal execution of the API request
 */
async function executeRequest(diff, apiKey, model) {
  const isGroq = apiKey.startsWith('gsk_');
  const baseUrl = isGroq ? GROQ_API_URL : GROK_API_URL;
  const defaultModel = isGroq ? DEFAULT_GROQ_MODEL : DEFAULT_GROK_MODEL;
  const targetModel = model || defaultModel;

  const truncatedDiff =
    diff.length > 30000 ? diff.slice(0, 30000) + '\n...(truncated)' : diff;

  const systemPrompt = `You are an expert software engineer.
Generate a concise, standardized commit message following the Conventional Commits specification based on the provided git diff.

Rules:
1. Format: <type>(<scope>): <subject>
2. Keep the subject line under 72 characters.
3. If there are multiple changes, use a bulleted body.
4. Detect breaking changes and add "BREAKING CHANGE:" footer if necessary.
5. Use types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
6. Return ONLY the commit message, no explanations or markdown code blocks.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await getFetch()(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Diff:\n${truncatedDiff}` },
        ],
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let msg = response.statusText;
      let parsed = null;

      // Prefer JSON if available
      try {
        if (typeof response.json === 'function') {
          parsed = await response.json().catch(() => null);
        }
      } catch {}

      if (parsed && typeof parsed === 'object') {
        msg = parsed?.error?.message || msg;
      } else {
        // Fallback to text only if supported
        let text = '';
        if (typeof response.text === 'function') {
          text = await response.text().catch(() => '');
          try {
            const errorData = text ? JSON.parse(text) : {};
            msg = errorData?.error?.message || msg;
          } catch {
            if (text) msg = text.slice(0, 500);
          }
        }
      }

      throw new Error(`${isGroq ? 'Groq' : 'Grok'} API Error: ${response.status} ${msg}`);
    }

    const data = await response.json();

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`No response content from ${isGroq ? 'Groq' : 'Grok'}`);
    }

    // Strip markdown fences if the model ignores instructions
    return String(content)
      .trim()
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`${isGroq ? 'Groq' : 'Grok'} API Error: request timed out`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Validate API Key
 */
async function validateGrokApiKey(apiKey) {
  const isGroq = apiKey.startsWith('gsk_');
  const baseUrl = isGroq ? GROQ_API_URL : GROK_API_URL;
  const model = isGroq ? DEFAULT_GROQ_MODEL : DEFAULT_GROK_MODEL;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await getFetch()(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (response.ok) return { valid: true };

    // Always report status code for deterministic tests
    return { valid: false, error: `Status: ${response.status}` };
  } catch (error) {
    if (error?.name === 'AbortError') return { valid: false, error: 'Request timed out' };
    return { valid: false, error: String(error?.message || error) };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateGrokCommitMessage,
  validateGrokApiKey,
};
