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
  const normalizedRepoPath = normalizePath(repoPath).toLowerCase();

  // Critical ignores that are ALWAYS enforced (lowercase for comparison)
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
    '.ds_store'
  ];

  const criticalExtensions = [
    '.log'
  ];

  return (absolutePath) => {
    // 1. Normalize and lowercase for consistent matching
    const normalizedTarget = normalizePath(absolutePath).toLowerCase();
    
    // 2. Determine relative path
    let relativePath;
    if (normalizedTarget.startsWith(normalizedRepoPath)) {
        relativePath = normalizedTarget.slice(normalizedRepoPath.length).replace(/^\/+/, '');
    } else {
        // Fallback to path.relative if startsWith fails for some reason
        relativePath = normalizePath(path.relative(repoPath, absolutePath)).toLowerCase();
    }

    // Handle root path case
    if (!relativePath || relativePath === '.') return false;

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

    // 4. Check user patterns
    for (const pattern of userPatterns) {
      const cleanPattern = pattern.toLowerCase().replace(/^\/+/, '');
      
      if (relativePath === cleanPattern) return true;
      if (relativePath.startsWith(cleanPattern + '/')) return true;
      
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
