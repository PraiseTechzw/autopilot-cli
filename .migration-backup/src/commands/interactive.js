/**
 * Interactive Command
 * Toggle between Safety Mode (Interactive) and Full Autopilot (Automated)
 */

const logger = require('../utils/logger');
const { loadConfig, saveConfig } = require('../config/loader');

async function interactive(state, options) {
  const repoPath = options?.cwd || process.cwd();
  const isGlobal = options?.global || false;

  if (!state) {
    const config = await loadConfig(repoPath);
    const current = config.ai?.interactive;
    logger.info(`Current AI Mode: ${current ? '🛡️  Safety (Manual Approval)' : '🚀 Full Autopilot (Automated)'}`);
    logger.info('Usage: autopilot interactive <on|off>');
    return;
  }

  const newState = state.toLowerCase() === 'on';
  
  // Load existing config to modify
  const config = await loadConfig(repoPath);
  
  // Ensure AI object exists
  if (!config.ai) config.ai = {};
  
  config.ai.interactive = newState;

  await saveConfig(repoPath, config, isGlobal);

  if (newState) {
    logger.success(`🛡️  AI Safety Mode enabled ${isGlobal ? '(Global)' : '(Local)'}. Autopilot will ask for approval before committing.`);
  } else {
    logger.success(`🚀 Full Autopilot enabled ${isGlobal ? '(Global)' : '(Local)'}. Autopilot will now commit and push automatically.`);
  }
}

module.exports = interactive;
