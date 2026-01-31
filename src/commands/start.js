/**
 * Command: start
 * Starts the Autopilot watcher in the foreground
 */

const process = require('process');
const logger = require('../utils/logger');
const Watcher = require('../core/watcher');
const { getRunningPid } = require('../utils/process');

const start = async (options) => {
  const repoPath = process.cwd();

  try {
    // Check if already running
    const runningPid = await getRunningPid(repoPath);
    if (runningPid) {
      logger.warn(`Autopilot is already running (PID: ${runningPid})`);
      logger.info('Run "autopilot stop" to stop the current instance.');
      return;
    }

    // Initialize watcher
    const watcher = new Watcher(repoPath);

    logger.section('Starting Autopilot');
    logger.info('Press Ctrl+C to stop, or run "autopilot stop" in another terminal.');
    
    // Start watching
    await watcher.start();

    // Keep process alive is handled by chokidar being persistent
    // The watcher handles process signals for cleanup

  } catch (error) {
    logger.error(`Failed to start autopilot: ${error.message}`);
    process.exit(1);
  }
};

module.exports = start;
