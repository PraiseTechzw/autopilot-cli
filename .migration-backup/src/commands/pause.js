const logger = require('../utils/logger');
const StateManager = require('../core/state');

function pauseCommand(reason) {
  const root = process.cwd();
  const stateManager = new StateManager(root);

  if (stateManager.isPaused()) {
    logger.warn('Autopilot is already paused.');
    return;
  }

  const pauseReason = typeof reason === 'string' ? reason : 'User paused';
  stateManager.pause(pauseReason);
  logger.success(`Autopilot paused: "${pauseReason}"`);
}

module.exports = pauseCommand;
