const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { getIgnorePath } = require('../utils/paths');

/**
 * Standardize path to use forward slashes
 * @param {string} p - Path to normalize
 * @returns {string} Normalized path
 */
const normalizePath = (p) => p.replace(/\\/g, '/');

/**
 * Read ignore file patterns
 * @param {string} repoPath 
 * @returns {Promise<string[]>} Array of ignore patterns
 */
const readIgnoreFile = async (repoPath) => {
  const ignorePath = getIgnorePath(repoPath);
  try {
    if (await fs.pathExists(ignorePath)) {
      const content = await fs.readFile(ignorePath, 'utf-8');
      return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
    }
  } catch (error) {
    logger.debug(`Error reading ignore file: ${error.message}`);
  }
  return [];
};

/**
 * Create ignore file
 */
const createIgnoreFile = async (repoPath, patterns = []) => {
  const ignorePath = getIgnorePath(repoPath);
  try {
    const content =
      `# Autopilot Ignore File\n# Add patterns to exclude from autopilot watching\n\n` +
      patterns.join('\n');
    await fs.writeFile(ignorePath, content);
    logger.success('Created .autopilotignore file');
  } catch (error) {
    logger.error(`Failed to create ignore file: ${error.message}`);
  }
};

/**
 * Create a filter function for Chokidar
 * @param {string} repoPath - Root of the repository
 * @param {string[]} userPatterns - Custom ignore patterns
 * @returns {function} Filter function (path => boolean)
 */
const createIgnoredFilter = (repoPath, userPatterns = []) => {
  const normalizedRepoPath = normalizePath(repoPath);

  // Critical ignores that are ALWAYS enforced
  const criticalPrefixes = [
    '.git',
    'node_modules',
    '.vscode',
    '.idea',
    'dist',
    'build',
    'coverage',
    '.next'
  ];

  const criticalFiles = [
    'autopilot.log',
    '.autopilot.pid',
    '.DS_Store'
  ];

  const criticalExtensions = [
    '.log'
  ];

  return (absolutePath) => {
    // 1. Normalize paths
    const normalizedAbs = normalizePath(absolutePath);
    
    // 2. Get relative path
    let relativePath = normalizedAbs;
    if (normalizedAbs.startsWith(normalizedRepoPath)) {
      relativePath = normalizedAbs.slice(normalizedRepoPath.length);
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.slice(1);
      }
    }

    // Handle root path case
    if (!relativePath) return false;

    // 3. Check critical matches
    const parts = relativePath.split('/');
    
    // Check directories/prefixes
    for (const part of parts) {
      if (criticalPrefixes.includes(part)) return true;
    }

    // Check specific filenames (last part)
    const filename = parts[parts.length - 1];
    if (criticalFiles.includes(filename)) return true;

    // Check extensions
    for (const ext of criticalExtensions) {
      if (filename.endsWith(ext)) return true;
    }

    // 4. Check user patterns (simple glob-like)
    // TODO: Use micromatch if more complex patterns needed, but for now simple matching
    // Note: chokidar handles globs in its 'ignored' option if passed as array, 
    // but here we are providing a function.
    
    // We can rely on chokidar's glob handling if we pass array, but we are returning a function.
    // If we want to support user globs in this function, we'd need micromatch.
    // However, Chokidar accepts an array of strings/globs/functions.
    // We should probably rely on Chokidar for user patterns if possible, 
    // BUT the requirement says "Apply ignore rules in TWO places: a) chokidar ignored function b) internal ignore matcher".
    // So we must handle it here too.
    
    // Simple implementation for user patterns:
    for (const pattern of userPatterns) {
      // Remove leading slash for matching relative path
      const cleanPattern = pattern.replace(/^\/+/, '');
      
      // Exact match
      if (relativePath === cleanPattern) return true;
      
      // Directory match
      if (relativePath.startsWith(cleanPattern + '/')) return true;
      
      // Extension match (*.log)
      if (cleanPattern.startsWith('*.')) {
        const ext = cleanPattern.slice(1);
        if (filename.endsWith(ext)) return true;
      }
    }

    return false;
  };
};

module.exports = {
  readIgnoreFile,
  createIgnoreFile,
  createIgnoredFilter,
  normalizePath
};
