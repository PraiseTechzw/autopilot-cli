const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODELS = [
  'openai/gpt-oss-20b:free',
  'google/gemma-4-31b-it:free',
  'openrouter/free',
];

function findEnvFile(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return null;
}

function loadEnvFile() {
  const envPath = findEnvFile();
  if (!envPath) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const normalizedLine = trimmed.replace(/^export\s+/, '');
    const separatorIndex = normalizedLine.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const value = normalizedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }

  return values;
}

function resolveApiKey(apiKey) {
  const envValues = loadEnvFile();
  return apiKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || envValues.OPENROUTER_API_KEY || envValues.OPENAI_API_KEY;
}

function parseModelList(rawList) {
  if (!rawList || typeof rawList !== 'string') {
    return [];
  }

  return rawList
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getModelCandidates(model) {
  const configuredModels = parseModelList(process.env.AUTOPILOT_OPENROUTER_MODELS);
  const baseModels = configuredModels.length > 0 ? configuredModels : DEFAULT_MODELS;

  if (model && typeof model === 'string' && model !== 'default') {
    return [model, ...baseModels.filter((candidate) => candidate !== model)];
  }

  return baseModels;
}

async function generateCommitMessage(diff, apiKey, model = DEFAULT_MODELS[0]) {
  const key = resolveApiKey(apiKey);

  if (!key) {
    throw new Error('OpenRouter API key is required');
  }

  const modelsToTry = getModelCandidates(model);

  for (const candidateModel of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://autopilot-cli.dev',
          'X-Title': 'Autopilot CLI'
        },
        body: JSON.stringify({
          model: candidateModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert commit message generator. Return only one concise conventional commit message, no explanation.'
            },
            {
              role: 'user',
              content: `Generate a concise conventional commit message for this diff. Prefer a short summary with a conventional prefix.\n\n${diff}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(`OpenRouter model ${candidateModel} failed: ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';

      if (!content) {
        throw new Error('No response content from OpenRouter');
      }

      return content.trim();
    } catch (error) {
      logger.warn(`OpenRouter request failed for ${candidateModel}: ${error.message}`);
    }
  }

  throw new Error('All OpenRouter models failed');
}

module.exports = {
  generateCommitMessage,
  resolveApiKey,
  DEFAULT_MODELS,
  parseModelList,
  getModelCandidates
};
