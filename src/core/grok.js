const logger = require('../utils/logger');
const keys = require('./keys');

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
  if (!diff || !diff.trim()) {
    return 'chore: update changes';
  }

  // If a custom key is provided, use it directly
  if (customApiKey) {
    return await executeRequest(diff, customApiKey, model);
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
      const isRateLimit = error.message.includes('429');
      const isInvalid = error.message.includes('401') || error.message.includes('403');

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

  const truncatedDiff = diff.length > 30000 ? diff.slice(0, 30000) + '\n...(truncated)' : diff;

  const systemPrompt = `You are an expert software engineer.
Generate a concise, standardized commit message following the Conventional Commits specification based on the provided git diff.

Rules:
1. Format: <type>(<scope>): <subject>
2. Keep the subject line under 72 characters.
3. If there are multiple changes, use a bulleted body.
4. Detect breaking changes and add "BREAKING CHANGE:" footer if necessary.
5. Use types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
6. Return ONLY the commit message, no explanations or markdown code blocks.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(BASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Diff:\n${truncatedDiff}` }
        ],
        temperature: 0.2,
        stream: false
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Grok API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Diff:\n${truncatedDiff}` }
      ],
      temperature: 0.2,
      stream: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || response.statusText;
    throw new Error(`${isGroq ? 'Groq' : 'Grok'} API Error: ${response.status} ${msg}`);
  }

  const data = await response.json();
  
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    throw new Error(`No response content from ${isGroq ? 'Groq' : 'Grok'}`);
  }

  let message = data.choices[0].message.content.trim();
  
  // Cleanup markdown if present
  message = message.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

  return message;
}

/**
 * Validate API Key
 */
async function validateGrokApiKey(apiKey) {
  const isGroq = apiKey.startsWith('gsk_');
  const baseUrl = isGroq ? GROQ_API_URL : GROK_API_URL;
  const model = isGroq ? DEFAULT_GROQ_MODEL : DEFAULT_GROK_MODEL;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(BASE_API_URL, {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) return { valid: true };
    const errorData = await response.json().catch(() => ({}));
    return { valid: false, error: errorData.error?.message || `Status: ${response.status}` };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}


module.exports = {
  generateGrokCommitMessage,
  validateGrokApiKey
};

