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

  // Always ignore these critical paths to prevent loops and noise
  const criticalIgnores = [
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

    // 3. Check critical directory prefixes
    // We check if any path segment matches a critical ignore
    const parts = relativePath.split('/');
    for (const part of parts) {
      if (criticalIgnores.includes(part)) return true;
    }

    // 4. Check file extensions and exact matches
    if (relativePath.endsWith('.log')) return true;
    if (criticalFiles.some(f => relativePath.endsWith(f))) return true;

    // 5. Check user patterns (simple prefix/suffix matching for now)
    // For robust glob support without adding dependencies, we rely on basic checks
    // Most users use simple dir/ or *.ext patterns
    for (const pattern of userPatterns) {
      // Remove leading/trailing slashes for comparison
      const cleanPattern = pattern.replace(/^\/+|\/+$/g, '');
      
      // Directory match (e.g., "temp/")
      if (pattern.endsWith('/') && (relativePath === cleanPattern || relativePath.startsWith(cleanPattern + '/'))) {
        return true;
      }
      
      // Extension match (e.g., "*.tmp")
      if (pattern.startsWith('*.') && relativePath.endsWith(pattern.slice(1))) {
        return true;
      }

      // Exact match
      if (relativePath === cleanPattern) {
        return true;
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
