const logger = require('../utils/logger');
const StateManager = require('../core/state');

function resumeCommand() {
  const root = process.cwd();
  const stateManager = new StateManager(root);

  if (!stateManager.isPaused()) {
    logger.warn('Autopilot is already running.');
    return;
  }

  stateManager.resume();
  logger.success('Autopilot resumed.');
}

module.exports = resumeCommand;
