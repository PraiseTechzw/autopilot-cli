/**
 * Default configuration values for Autopilot
 * Built by Praise Masunga (PraiseTechzw)
 */

const DEFAULT_CONFIG = {
  debounceSeconds: 20,
  minSecondsBetweenCommits: 180,
  autoPush: true,
  blockedBranches: ['main', 'master'],
  requireChecks: false,
  checks: [],
  commitMessageMode: 'smart', // smart | simple | ai
  ai: {
    enabled: false,
    provider: 'gemini', // gemini | grok
    apiKey: '', 
    grokApiKey: '',
    model: 'gemini-2.5-flash', // default for gemini
    grokModel: 'grok-beta', // default for grok
    interactive: true
  },
  // Phase 1: Team Mode
  teamMode: false,
  pullBeforePush: true,
  conflictStrategy: 'abort',
  maxUnpushedCommits: 5,
  // Phase 1: Pre-commit checks
  preCommitChecks: {
    secrets: true,
    fileSize: true,
    lint: false,
    test: null
  }
};

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  '.env',
  '.env.*',
  'coverage/',
  '*.log',
  'autopilot.log',
  '.autopilot.pid',
  '.DS_Store',
  '.git/',
  '.idea/',
  '.vscode/'
].join('\n');

module.exports = {
  DEFAULT_CONFIG,
  DEFAULT_IGNORE_PATTERNS,
};
