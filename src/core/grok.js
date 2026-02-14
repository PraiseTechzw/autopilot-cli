/**
 * xAI Grok Integration for Autopilot
 * Generates commit messages using the Grok API
 */

const logger = require('../utils/logger');

const BASE_API_URL = 'https://api.x.ai/v1/chat/completions';
const DEFAULT_MODEL = 'grok-beta'; // or current stable model

/**
 * Generate a commit message using Grok API
 * @param {string} diff - The git diff content
 * @param {string} apiKey - xAI API Key
 * @param {string} [model] - Grok Model ID
 * @returns {Promise<string>} Generated commit message
 */
async function generateGrokCommitMessage(diff, apiKey, model = DEFAULT_MODEL) {
  if (!diff || !diff.trim()) {
    return 'chore: update changes';
  }

  // Truncate diff to avoid token limits (safe limit)
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

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
      throw new Error('No response content from Grok');
    }

    let message = data.choices[0].message.content.trim();
    
    // Cleanup markdown if present
    message = message.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

    return message;

  } catch (error) {
    logger.error(`Grok Generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Validate Grok API Key
 * @param {string} apiKey 
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateGrokApiKey(apiKey) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(BASE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) return { valid: true };
    return { valid: false, error: `Status: ${response.status}` };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

module.exports = {
  generateGrokCommitMessage,
  validateGrokApiKey
};
