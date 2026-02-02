/**
 * Default configuration values for Autopilot
 * Built by Praise Masunga (PraiseTechzw)
 */

const DEFAULT_CONFIG = {
  debounceSeconds: 20,
  minSecondsBetweenCommits: 180,
  autoPush: true,
  blockBranches: ['main', 'master'],
  requireChecks: false,
  checks: [],
  commitMessageMode: 'smart', // smart | simple | ai
  ai: {
    enabled: false,
    apiKey: '',
    model: 'gemini-pro',
    interactive: false
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
