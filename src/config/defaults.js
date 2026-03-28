/**
 * Default configuration values for Autopilot
 * Built by Praise Masunga (PraiseTechzw)
 */

const DEFAULT_CONFIG = {
  watchPath: '.',
  debounceMs: 20000,
  aiProvider: 'none',
  aiApiKey: '',
  protectedBranches: ['main', 'master', 'production', 'prod', 'release'],
  allowPushToProtected: false,
  notificationsEnabled: true,
  maxRetryAttempts: 5,
  ignorePaths: ['.git', 'node_modules', '.autopilot-state.json', '.autopilot-queue.json'],
  
  // Legacy/Internal
  minSecondsBetweenCommits: 180,
  autoPush: true,
  requireChecks: false,
  checks: [],
  commitMessageMode: 'ai',
  teamMode: false,
  pullBeforePush: true,
  conflictStrategy: 'abort',
  maxUnpushedCommits: 5,
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
