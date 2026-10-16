/**
 * Smart commit message generator
 * Uses git diff analysis to generate professional, senior-level commit messages.
 */

const path = require('path');
const logger = require('../utils/logger');
const openrouter = require('./openrouter');
const gemini = require('./gemini');
const grok = require('./grok');
const HistoryManager = require('./history');

const { generateRuleBasedMessage } = require('./commitMessageGenerator');

/**
 * Generate a conventional commit message based on diff analysis
 * @param {Array<{status: string, file: string}>} files - Array of changed file objects
 * @param {string} diffContent - Raw git diff content
 * @param {object} config - Configuration object
 * @returns {Promise<string>} Conventional commit message
 */
async function generateCommitMessage(files, diffContent, config = {}) {
  let message = '';
  
  const mode = config.commitMessageMode || 'smart';
  const aiProvider = resolveAiProvider(config);
  const aiApiKey = config.ai?.apiKey || config.aiApiKey;
  const aiEnabled = config.ai?.enabled ?? false;

  if (!files || files.length === 0) {
    message = 'update: minor changes';
  } else if (mode === 'simple') {
    // Simple mode still describes the actual change; it only skips AI.
    message = generateSmartCommitMessage(files, diffContent);
  } else if (aiProvider !== 'none' && diffContent && diffContent.trim() && aiEnabled) {
    // AI Mode
    try {
      logger.info(`Generating AI commit message using ${aiProvider}...`);

      if (aiProvider === 'openrouter') {
        message = await openrouter.generateCommitMessage(diffContent, aiApiKey, config.ai?.model);
      } else if (aiProvider === 'gemini') {
        message = await gemini.generateAICommitMessage(diffContent, aiApiKey || config.ai?.grokApiKey, config.ai?.model);
      } else if (aiProvider === 'grok') {
        message = await grok.generateGrokCommitMessage(diffContent, aiApiKey || config.ai?.grokApiKey, config.ai?.model);
      } else {
        message = generateSmartCommitMessage(files, diffContent);
      }

      if (!message || message.length < 3) {
        throw new Error('AI returned empty or invalid message');
      }
      message = normalizeConventionalMessage(message, generateSmartCommitMessage(files, diffContent));
    } catch (error) {
      logger.warn(`AI generation failed (${error.message}), falling back to local analysis.`);
      message = generateSmartCommitMessage(files, diffContent);
    }
  } else {
    // Smart Rule-based Fallback (Senior-level)
    message = generateSmartCommitMessage(files, diffContent);
  }

  return normalizeConventionalMessage(message, generateSmartCommitMessage(files, diffContent));
}

const CONVENTIONAL_TYPES = new Set(['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']);

function normalizeConventionalMessage(message, fallback = 'chore: update project files') {
  const cleaned = String(message || '')
    .replace(/^\s*```(?:\w+)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .replace(/^\s*(?:commit message|message)\s*:\s*/i, '')
    .replace(/^\s*\[autopilot\]\s*/i, '')
    .trim();
  const match = cleaned.match(/^([a-z]+)(?:\(([a-z0-9._/-]+)\))?(!)?:\s+([^\n]+)([\s\S]*)$/i);
  if (!match || !CONVENTIONAL_TYPES.has(match[1].toLowerCase())) return cleaned === fallback ? cleaned : normalizeConventionalMessage(fallback, 'chore: update project files');

  const type = match[1].toLowerCase();
  const scope = match[2] ? `(${match[2].toLowerCase()})` : '';
  const bang = match[3] || '';
  let subject = match[4].trim().replace(/[.。]+$/, '');
  subject = subject[0].toLowerCase() + subject.slice(1);
  if (!subject || `${type}${scope}${bang}: ${subject}`.length > 72) return cleaned === fallback ? cleaned : normalizeConventionalMessage(fallback, 'chore: update project files');
  const body = match[5].replace(/\s+$/, '');
  return `${type}${scope}${bang}: ${subject}${body}`;
}

function resolveAiProvider(config = {}) {
  const rawProvider = (config.ai?.provider || config.aiProvider || '').toString().trim().toLowerCase();
  const normalizedProvider = rawProvider === 'default' ? '' : rawProvider;
  const explicitApiKey = config.ai?.apiKey || config.aiApiKey || '';

  if (normalizedProvider === 'openrouter' || normalizedProvider === 'gemini' || normalizedProvider === 'grok' || normalizedProvider === 'none') {
    return normalizedProvider;
  }

  // Backward-compatible fallback:
  // - If the user provided a key but no explicit provider, prefer OpenRouter.
  // - If no provider is set, OpenRouter is the default AI path.
  if (explicitApiKey || !normalizedProvider) {
    return 'openrouter';
  }

  return 'openrouter';
}

/**
 * Smart generation logic extracted
 */
function generateSmartCommitMessage(files, diffContent) {
  const diffAnalysis = parseDiff(diffContent);
  const { type, scope, isBreaking, breakingSummary } = determineContext(files, diffAnalysis);
  const summary = generateSummary(type, scope, diffAnalysis, files);
  const bang = isBreaking ? '!' : '';
  let message = `${type}${scope ? `(${scope})` : ''}${bang}: ${summary}`;
  if (isBreaking) {
    message += `\n\nBREAKING CHANGE: ${breakingSummary}`;
  }
  return message;
}

/**
 * Parse raw diff into structured data
 */
function parseDiff(diff) {
  const analysis = {
    hunks: [],
    additions: [],
    deletions: [],
    touchedComponents: new Set(),
    touchedConfigKeys: new Set(),
    hasTests: false,
    hasDocs: false,
    hasUiChanges: false,
    hasThemeChanges: false,
    hasCliChanges: false,
  };

  if (!diff) return analysis;

  const lines = diff.split('\n');
  let currentFile = '';

  lines.forEach(line => {
    if (line.startsWith('diff --git')) {
      const parts = line.split(' ');
      // Handle "a/path" and "b/path"
      const bPart = parts[parts.length - 1];
      currentFile = bPart.startsWith('b/') ? bPart.slice(2) : bPart;
      return;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1).trim();
      if (content) {
        analysis.additions.push({ file: currentFile, content });
        analyzeLine(content, 'add', currentFile, analysis);
      }
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      const content = line.slice(1).trim();
      if (content) {
        analysis.deletions.push({ file: currentFile, content });
        analyzeLine(content, 'del', currentFile, analysis);
      }
    }
  });

  return analysis;
}

function analyzeLine(content, type, file, analysis) {
  // Config keys
  if (file.endsWith('.json') || file.endsWith('.js')) {
    // Look for keys like "key": or key:
    if (content.match(/^['"]?[\w-]+['"]?\s*:/) && !content.includes('function')) {
      const key = content.split(':')[0].trim().replace(/['"]/g, '');
      if (key && key.length < 30) analysis.touchedConfigKeys.add(key);
    }
  }

  // UI/Theme detection
  if (content.includes('className=') || content.includes('style=')) {
    analysis.hasUiChanges = true;
  }
  if (content.includes('var(--') || file.includes('theme')) {
    analysis.hasThemeChanges = true;
  }

  // Component detection
  if (file.includes('components/') && type === 'add' && (content.startsWith('export const') || content.startsWith('export function'))) {
    const match = content.match(/export (?:const|function) (\w+)/);
    if (match) analysis.touchedComponents.add(match[1]);
  }
}

function determineContext(files, analysis) {
  const fileNames = files.map(file => file.file.replace(/\\/g, '/'));
  const all = (predicate) => fileNames.length > 0 && fileNames.every(predicate);
  let type = 'chore';
  let scope = '';
  let isBreaking = false;
  let breakingSummary = '';

  if (all(file => /(^|\/)(test|tests|__tests__)\//.test(file) || /\.(test|spec)\./.test(file))) {
    type = 'test';
    analysis.hasTests = true;
  } else if (all(file => /(^|\/)(docs|documentation)\//.test(file) || /\.mdx?$/.test(file))) {
    type = 'docs';
    analysis.hasDocs = true;
  } else if (all(file => file.startsWith('.github/workflows/') || /(^|\/)\.ci\//.test(file))) {
    type = 'ci';
  } else if (all(file => /\.(css|scss|sass|less)$/.test(file)) || analysis.hasThemeChanges || analysis.hasUiChanges) {
    type = 'style';
  } else if (files.some(file => ['A', 'A ', '??'].includes(file.status)) && fileNames.some(file => /\.(js|jsx|ts|tsx|py|go|rs)$/.test(file))) {
    type = 'feat';
  } else if (fileNames.some(file => file.startsWith('src/'))) {
    const declaresNewSymbol = analysis.additions.some(change => /\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let)\s+[A-Za-z_$][\w$]*/.test(change.content));
    const replacesSymbol = analysis.deletions.some(change => /\b(?:function|class)\s+[A-Za-z_$][\w$]*/.test(change.content)) && analysis.additions.length > 0;
    const indicatesFix = fileNames.some(file => /(^|[-_/])(fix|bug)([-_/.]|$)/i.test(file)) ||
      [...analysis.additions, ...analysis.deletions].some(change => /\b(?:bug|fix|crash|throw|error|invalid input)\b/i.test(change.content));
    type = declaresNewSymbol ? 'feat' : indicatesFix ? 'fix' : 'refactor';
  }

  const directories = [...new Set(fileNames.map(file => path.posix.dirname(file)))];
  if (directories.length === 1 && directories[0] !== '.') {
    const parts = directories[0].split('/').filter(part => !['src', 'lib'].includes(part));
    scope = parts[parts.length - 1] || '';
    if (scope === 'components') scope = 'ui';
    if (scope === 'workflows') scope = 'ci';
    if (type === 'test' && scope === 'test') {
      scope = path.posix.basename(fileNames[0]).replace(/\.(test|spec)\.[^.]+$/, '').replace(/\.[^.]+$/, '');
    }
  } else if (analysis.hasThemeChanges) {
    scope = 'theme';
  }

  // Only mark an API change as breaking when a function signature is visibly changed.
  for (const removed of analysis.deletions) {
    const oldSignature = removed.content.match(/(?:async\s+)?(?:function\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
    if (!oldSignature) continue;
    const replacement = analysis.additions.find(added => {
      const newSignature = added.content.match(/(?:async\s+)?(?:function\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
      return newSignature && newSignature[1] === oldSignature[1] && newSignature[2] !== oldSignature[2];
    });
    if (replacement) {
      const newSignature = replacement.content.match(/(?:async\s+)?(?:function\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/);
      isBreaking = true;
      type = 'refactor';
      const switchedToOptions = /^\s*\{/.test(newSignature[2]) && !/^\s*\{/.test(oldSignature[2]);
      breakingSummary = switchedToOptions
        ? `change ${oldSignature[1]} from positional arguments to an options object`
        : `change the ${oldSignature[1]} function signature`;
      break;
    }
  }

  return { type, scope, isBreaking, breakingSummary };
}

function generateSummary(type, scope, analysis, files) {
  const file = files.length === 1 ? files[0] : null;
  const version = analysis.additions.map(change => change.content).find(line => /"version"\s*:/.test(line));
  if (file?.file.endsWith('package.json') && version && files.some(change => change.file.endsWith('package.json'))) {
    const match = version.match(/"version"\s*:\s*"([^"]+)"/);
    if (match) return `bump package version to ${match[1]}`;
  }
  if (analysis.hasThemeChanges) return scope === 'ui' ? 'update component styles' : 'update theme variables';

  const name = file ? path.posix.basename(file.file).replace(/\.(test|spec)\.[^.]+$/, '').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').toLowerCase() : scope;
  const oldFunction = analysis.deletions.map(change => change.content.match(/(?:async\s+)?(?:function\s+)?([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/)).find(Boolean);
  if (oldFunction && type === 'refactor' && analysis.additions.some(change => new RegExp(`\\b${oldFunction[1]}\\s*\\(`).test(change.content))) {
    return `change ${oldFunction[1]} signature`;
  }
  if (file && ['A', 'A ', '??'].includes(file.status)) {
    const suffix = /\.(jsx|tsx)$/.test(file.file) ? ' component' : '';
    return `add ${name}${suffix}`;
  }
  if (file && (file.status === 'D' || file.status === ' D')) return `remove ${name}`;

  if (analysis.additions.some(change => /return\s+null\b/.test(change.content)) && analysis.deletions.some(change => /throw\s+new\s+Error/.test(change.content))) {
    return 'handle invalid input without throwing';
  }
  if (analysis.additions.some(change => /Quick Start/.test(change.content))) return 'document the quick start steps';
  if (analysis.additions.some(change => /npm ci/.test(change.content))) return 'install dependencies in the workflow';
  if (type === 'test' && name) return `update ${name} tests`;
  if (name) return `update ${name}`;
  return `update ${scope || 'project behavior'}`;
}

async function addTrailers(message) {
  const { getIdentity } = require('../utils/identity');
  const { generateSignature } = require('../utils/crypto');
  const { version } = require('../../package.json');

  const identity = await getIdentity();
  const timestamp = Date.now().toString();
  
  // Content to sign: message|timestamp|version|userId
  // This ensures integrity of the whole commit data
  const contentToSign = `${message}|${timestamp}|${version}|${identity.id}`;
  const signature = generateSignature(contentToSign, identity.id);

  const trailers = [
    '',
    'Autopilot-Commit: true',
    `Autopilot-Version: ${version}`,
    `Autopilot-User: ${identity.id}`,
    `Autopilot-Signature: ${signature}`
  ];

  return message + trailers.join('\n');
}

module.exports = {
  generateCommitMessage,
  parseDiff,
  addTrailers
};
