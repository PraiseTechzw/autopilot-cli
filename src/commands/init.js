/**
 * Autopilot init command - Initialize repository configuration
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const logger = require('../utils/logger');
const { getConfigPath, getIgnorePath, getGitPath } = require('../utils/paths');
const { DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS } = require('../config/defaults');
const { validateApiKey } = require('../core/gemini');

function askQuestion(query) {
  if (!process.stdin.isTTY) {
      return Promise.resolve(''); // Non-interactive fallback
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}


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
 * @param {object} [overrides] - Configuration overrides
 * @returns {Promise<boolean>} True if created, false if already exists
 */
async function createConfigFile(repoPath, overrides = {}) {
  const configPath = getConfigPath(repoPath);
  
  if (fs.existsSync(configPath)) {
    logger.info('.autopilotrc.json already exists');
    return false;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...overrides };
  await fs.writeJson(configPath, finalConfig, { spaces: 2 });
  logger.success('Created .autopilotrc.json');
  return true;
}

/**
 * Update .gitignore with Autopilot specific files
 * @param {string} repoPath 
 */
async function updateGitIgnore(repoPath) {
  const gitIgnorePath = path.join(repoPath, '.gitignore');
  const toIgnore = ['autopilot.log', '.autopilot.pid', '.vscode/'];
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

    const teamMode = await askQuestion('Enable team mode? (pull before push) [y/N]: ');
    const useTeamMode = teamMode.toLowerCase() === 'y';

    // Phase 3: AI Configuration
    const enableAI = await askQuestion('Enable AI commit messages (Gemini)? [y/N]: ');
    let useAI = enableAI.toLowerCase() === 'y';
    
    let apiKey = '';
    let interactive = false;
    
    if (useAI) {
      while (true) {
        apiKey = await askQuestion('Enter your Google Gemini API Key: ');
        
        if (!apiKey) {
           logger.warn('API Key cannot be empty if AI is enabled.');
           const retry = await askQuestion('Try again? (n to disable AI) [Y/n]: ');
           if (retry.toLowerCase() === 'n') {
             useAI = false;
             break;
           }
           continue;
        }

        logger.info('Verifying API Key...');
        const result = await validateApiKey(apiKey);
        
        if (result.valid) {
          logger.success('API Key verified successfully! ✨');
          break;
        } else {
          logger.warn(`API Key validation failed: ${result.error}`);
          const retry = await askQuestion('Try again? (n to disable AI, p to proceed anyway) [Y/n/p]: ');
          const choice = retry.toLowerCase();
          
          if (choice === 'n') {
            useAI = false;
            break;
          } else if (choice === 'p') {
            logger.warn('Proceeding with potentially invalid API key.');
            break;
          }
          // Default is retry (loop)
        }
      }

      if (useAI) {
        const interactiveAns = await askQuestion('Review AI messages before committing? [y/N]: ');
        interactive = interactiveAns.toLowerCase() === 'y';
      }
    }

    const overrides = {
      teamMode: useTeamMode,
      ai: {
        enabled: useAI,
        apiKey: apiKey,
        model: 'gemini-1.5-flash',
        interactive: interactive
      },
      commitMessageMode: useAI ? 'ai' : 'smart'
    };

    const created = await createConfigFile(repoPath, overrides);
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
