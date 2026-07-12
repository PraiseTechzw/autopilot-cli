/**
 * Autopilot init command - Initialize repository configuration
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const execa = require('execa');
const logger = require('../utils/logger');
const { getConfigPath, getIgnorePath, getGitPath } = require('../utils/paths');
const { DEFAULT_CONFIG, DEFAULT_IGNORE_PATTERNS } = require('../config/defaults');
const gemini = require('../core/gemini');
const grok = require('../core/grok');
const EXIT_CODES = require('../utils/exit-codes');

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

async function askYesNo(query, defaultYes = false) {
  const suffix = defaultYes ? ' [Y/n]: ' : ' [y/N]: ';
  const answer = await askQuestion(query.endsWith('?') ? `${query}${suffix}` : `${query}${suffix}`);
  const normalized = answer.trim().toLowerCase();

  if (!normalized) {
    return defaultYes;
  }

  return normalized === 'y' || normalized === 'yes';
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

async function initializeGitRepo(repoPath) {
  logger.info('Git is the version history for your project. `git init` creates that history so Autopilot has a safe place to save commits.');

  const shouldInit = await askYesNo('This folder is not a git repository yet. Create one now?', true);
  if (!shouldInit) {
    logger.error('Autopilot needs a git repository to track changes.');
    return false;
  }

  try {
    await execa('git', ['init'], { cwd: repoPath });
    logger.success('Created a new git repository');
    return true;
  } catch (error) {
    logger.error(`Could not create a git repository: ${error.stderr || error.message}`);
    return false;
  }
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

  await fs.writeFile(ignorePath, DEFAULT_IGNORE_PATTERNS.trim() + '\n', 'utf8');
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
  const toIgnore = ['.autopilot.log', '.autopilot.pid', '.autopilot-state.json', '.autopilot/', '.vscode/'];
  let content = '';
  
  try {
    let exists = false;
    if (await fs.pathExists(gitIgnorePath)) {
      content = await fs.readFile(gitIgnorePath, 'utf-8');
      exists = true;
    }
    
    // Split by universal newline to handle CRLF safely
    const lines = content.split(/\r?\n/).map(l => l.trim());
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
      if (process.stdin.isTTY) {
        const initialized = await initializeGitRepo(repoPath);
        if (!initialized) {
          process.exit(EXIT_CODES.NOT_GIT_REPO);
        }
      } else {
        logger.error('Not a git repository. Please run this inside a git repo.');
        process.exit(EXIT_CODES.NOT_GIT_REPO);
      }
    }

    logger.success('Git repository detected');

    // Create files
    await createIgnoreFile(repoPath);

    const teamMode = await askQuestion('Enable team mode? (pull before push) [y/N]: ');
    const useTeamMode = teamMode.toLowerCase() === 'y';

    // Phase 3: AI Configuration (Zero-Config)
    logger.info('\n🤖 AI Commit Messages are ENABLED by default (Zero-Config).');
    const customAI = await askQuestion('Would you like to use your own AI API keys instead? [y/N]: ');
    
    let useAI = true;
    let apiKey = '';
    let grokApiKey = '';
    let provider = 'grok';
    let interactive = DEFAULT_CONFIG.ai.interactive;

    
    if (customAI.toLowerCase() === 'y') {
      // Select Provider
      const providerAns = await askQuestion('Select AI Provider (gemini/grok) [grok]: ');
      provider = providerAns.toLowerCase() === 'gemini' ? 'gemini' : 'grok';

      if (provider === 'gemini') {
        logger.info('Need a free Gemini key? Get one at https://aistudio.google.com/app/apikey');
      } else {
        logger.info('Need a Grok key? Create one at https://console.x.ai/');
      }
      logger.info('If you are still exploring, press Enter on the next prompt to keep using the default AI mode.');
      
      while (true) {
        const keyPrompt = provider === 'grok' 
          ? 'Enter your xAI Grok API Key: ' 
          : 'Enter your Google Gemini API Key: ';
          
        const keyInput = await askQuestion(keyPrompt);
        
        if (!keyInput) {
           logger.warn('Custom API Key cannot be empty. Falling back to System AI.');
           const retry = await askQuestion('Try again with custom key? (n to use System AI) [Y/n]: ');
           if (retry.toLowerCase() === 'n') {
             break;
           }
           continue;
        }

        logger.info(`Verifying custom ${provider} API Key...`);
        let result;
        if (provider === 'grok') {
          result = await grok.validateGrokApiKey(keyInput);
        } else {
          result = await gemini.validateApiKey(keyInput);
        }
        
        if (result.valid) {
          logger.success('Custom API Key verified successfully! ✨');
          if (provider === 'grok') grokApiKey = keyInput;
          else apiKey = keyInput;
          break;
        } else {
          logger.warn(`API Key validation failed: ${result.error}`);
          const retry = await askQuestion('Try again? (n to use System AI, p to proceed anyway) [Y/n/p]: ');
          const choice = retry.toLowerCase();
          
          if (choice === 'n') {
            break;
          } else if (choice === 'p') {
            logger.warn('Proceeding with custom API key.');
            if (provider === 'grok') grokApiKey = keyInput;
            else apiKey = keyInput;
            break;
          }
        }
      }

      const interactiveAns = await askQuestion('Review AI messages before committing? [y/N]: ');
      interactive = interactiveAns.toLowerCase() === 'y';
    } else {
      logger.info('Using System AI (Zero-Config mode). ✨');
    }


    const overrides = {
      aiProvider: (customAI.toLowerCase() === 'y') ? provider : 'grok',
      ai: {
        enabled: true,
        provider: (customAI.toLowerCase() === 'y') ? provider : "grok",
        apiKey: apiKey || "",
        grokApiKey: grokApiKey || "",
        interactive: interactive,
        model: provider === 'grok' ? "grok-beta" : "gemini-2.5-flash"
      },
      teamMode: useTeamMode,
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
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
}

module.exports = initRepo;
