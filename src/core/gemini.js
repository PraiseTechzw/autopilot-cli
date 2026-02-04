/**
 * Google Gemini AI Integration for Autopilot
 * Generates commit messages using the Gemini Pro model
 */

const logger = require('../utils/logger');

const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Generate a commit message using Gemini API
 * @param {string} diff - The git diff content
 * @param {string} apiKey - Google Gemini API Key
 * @param {string} [model] - Gemini Model ID (default: gemini-2.5-flash)
 * @returns {Promise<string>} Generated commit message
 */
async function generateAICommitMessage(diff, apiKey, model = DEFAULT_MODEL) {
  if (!diff || !diff.trim()) {
    return 'chore: update changes';
  }

  // Truncate diff if it's too large (Gemini has token limits, though high)
  // A safe limit might be around 30k chars for now to be safe and fast
  const truncatedDiff = diff.length > 30000 ? diff.slice(0, 30000) + '\n...(truncated)' : diff;

  const prompt = `
You are an expert software engineer.
Generate a concise, standardized commit message following the Conventional Commits specification based on the provided git diff.

Rules:
1. Format: <type>(<scope>): <subject>
2. Keep the subject line under 72 characters.
3. If there are multiple changes, use a bulleted body.
4. Detect breaking changes and add "BREAKING CHANGE:" footer if necessary.
5. Use types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
6. Return ONLY the commit message, no explanations or markdown code blocks.

Diff:
${truncatedDiff}
`;

  try {
    const url = `${BASE_API_URL}${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
      throw new Error('No response content from Gemini');
    }

    let message = data.candidates[0].content.parts[0].text.trim();
    
    // Cleanup markdown if present (e.g. ```git commit ... ```)
    message = message.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

    return message;

  } catch (error) {
    logger.error(`AI Generation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Validate Gemini API Key
 * @param {string} apiKey 
 * @param {string} [model] - Gemini Model ID (default: gemini-2.5-flash)
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateApiKey(apiKey, model = DEFAULT_MODEL) {
  try {
    const url = `${BASE_API_URL}${model}:generateContent?key=${apiKey}`;
    // Simple test call with empty prompt
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }],
        generationConfig: { maxOutputTokens: 1 }
      })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        return { valid: false, error: errorMessage };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

module.exports = {
  generateAICommitMessage,
  validateApiKey
};
