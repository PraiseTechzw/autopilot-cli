/**
 * Smart commit message generator
 */

/**
 * Generate a conventional commit message based on changed files
 * @param {string[]} files - Array of changed file paths
 * @returns {string} Conventional commit message
 */
function generateCommitMessage(files) {
  if (!files || files.length === 0) {
    return 'chore: update changes';
  }

  const categories = {
    fix: false,
    feat: false,
    docs: false,
    test: false,
    chore: false,     // Generic chore (unknown files)
    config: false,    // Specific config files
  };

  for (const file of files) {
    const lowerFile = file.toLowerCase();
    const normalized = lowerFile.replace(/\\/g, '/');
    let matched = false;

    // Fix detection (highest priority)
    if (
      normalized.includes('/fix/') ||
      normalized.includes('fix-') ||
      normalized.includes('-fix') ||
      normalized.includes('bugfix') ||
      normalized.includes('hotfix') ||
      normalized.includes('error') ||
      normalized.includes('exception') ||
      normalized.endsWith('error.js') ||
      normalized.endsWith('error.ts')
    ) {
      categories.fix = true;
      matched = true;
    }

    // Docs detection
    if (normalized.endsWith('.md') || normalized.endsWith('.txt')) {
      categories.docs = true;
      matched = true;
    }

    // Test detection
    if (
      normalized.includes('.test.') ||
      normalized.includes('.spec.') ||
      normalized.includes('__tests__')
    ) {
      categories.test = true;
      matched = true;
    }

    // Feat detection - src/ changes that aren't tests
    if (
      (normalized.startsWith('src/') || normalized.includes('/src/')) &&
      !categories.test // Ensure we don't count tests as features if they happen to be in src
    ) {
      categories.feat = true;
      matched = true;
    }

    // Config files detection
    if (
      normalized === 'package.json' ||
      normalized.endsWith('.yml') ||
      normalized.endsWith('.yaml') ||
      normalized.endsWith('.json') ||
      normalized.endsWith('.config.js') ||
      normalized.endsWith('.config.ts') ||
      normalized.includes('.github/') ||
      normalized.includes('.gitignore') ||
      normalized.includes('.editorconfig')
    ) {
      categories.config = true;
      matched = true;
    }

    // Default to chore for other files
    if (!matched) {
      categories.chore = true;
    }
  }

  // Priority order: fix > feat > docs > test > chore
  if (categories.fix) {
    return 'fix: resolve issues';
  }
  if (categories.feat) {
    return 'feat: add new features';
  }
  if (categories.docs) {
    return 'docs: update documentation';
  }
  if (categories.test) {
    return 'test: update tests';
  }
  // "chore" category splits into explicit config vs generic changes
  if (categories.config) {
    return 'chore: update configuration';
  }
  if (categories.chore) {
    return 'chore: update changes';
  }

  return 'chore: update changes';
}

module.exports = { generateCommitMessage };
