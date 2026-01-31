/**
 * Autopilot init command - Initialize repository configuration
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { getConfigPath, getIgnorePath, getGitPath } = require('../utils/paths');
const { DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS } = require('../config/defaults');

/**
 * Verify current directory is a git repository
 * @param {string} repoPath - Path to check
 * @returns {boolean} True if git repo
 */
function isGitRepo(repoPath) {
  const gitPath = getGitPath(repoPath);
  return fs.existsSync(gitPath);
}

/**
 * Create .autopilotignore file with safe defaults
 * @param {string} repoPath - Repository path
 * @returns {Promise<boolean>} True if created, false if already exists
 */
async function createIgnoreFile(repoPath) {
  const ignorePath = getIgnorePath(repoPath);
  
  if (fs.existsSync(ignorePath)) {
    logger.info('.autopilotignore already exists');
    return false;
  }

  await fs.writeFile(ignorePath, DEFAULT_IGNORE_PATTERNS, 'utf8');
  logger.success('Created .autopilotignore');
  return true;
}

/**
 * Create .autopilotrc.json file with default configuration
 * @param {string} repoPath - Repository path
 * @returns {Promise<boolean>} True if created, false if already exists
 */
async function createConfigFile(repoPath) {
  const configPath = getConfigPath(repoPath);
  
  if (fs.existsSync(configPath)) {
    logger.info('.autopilotrc.json already exists');
    return false;
  }

  await fs.writeJson(configPath, DEFAULT_CONFIG, { spaces: 2 });
  logger.success('Created .autopilotrc.json');
  return true;
}

/**
 * Update .gitignore with Autopilot specific files
 * @param {string} repoPath 
 */
async function updateGitIgnore(repoPath) {
  const gitIgnorePath = path.join(repoPath, '.gitignore');
  const toIgnore = ['autopilot.log', '.autopilot.pid'];
  let content = '';
  
  try {
    if (await fs.pathExists(gitIgnorePath)) {
      content = await fs.readFile(gitIgnorePath, 'utf-8');
    }
    
    const lines = content.split('\n').map(l => l.trim());
    const newLines = [];
    let added = false;

    for (const item of toIgnore) {
      if (!lines.includes(item)) {
        newLines.push(item);
        added = true;
      }
    }

    if (added) {
      const newContent = content + (content && !content.endsWith('\n') ? '\n' : '') + newLines.join('\n') + '\n';
      await fs.writeFile(gitIgnorePath, newContent);
      logger.success('Updated .gitignore');
    }
  } catch (error) {
    logger.warn(`Could not update .gitignore: ${error.message}`);
  }
}

/**
 * Initialize Autopilot in current repository
 */
async function initRepo() {
  try {
    const repoPath = process.cwd();

    logger.section('🚀 Autopilot Init');
    logger.info('Built by Praise Masunga (PraiseTechzw)');
    logger.info('Initializing git automation...');

    // Verify git repository
    if (!isGitRepo(repoPath)) {
      logger.error('Not a git repository. Please run this inside a git repo.');
      process.exit(1);
    }

    logger.success('Git repository detected');

    // Create files
    await createIgnoreFile(repoPath);
    await createConfigFile(repoPath);
    await updateGitIgnore(repoPath);

    logger.section('✨ Initialization Complete');
    logger.info('Next steps:');
    logger.info('  1. Review .autopilotrc.json to customize settings');
    logger.info('  2. Review .autopilotignore to adjust ignore patterns');
    logger.info('  3. Run "autopilot start" to begin watching');
    
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = initRepo;
