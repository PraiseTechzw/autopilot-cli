/**
 * Command: start
 * Starts the Autopilot watcher in the foreground
 */

const process = require('process');
const logger = require('../utils/logger');
const Watcher = require('../core/watcher');
const { getRunningPid } = require('../utils/process');
const EXIT_CODES = require('../utils/exit-codes');

const start = async (options = {}) => {
  const isJson = !!options.json;
  const repoPath = process.cwd();

  try {
    // Check if already running
    const runningPid = await getRunningPid(repoPath);
    if (runningPid) {
      if (isJson) {
        console.log(JSON.stringify({ error: 'Already running', pid: runningPid }));
        process.exit(EXIT_CODES.WATCHER_ALREADY_RUNNING);
      } else {
        logger.warn(`Autopilot is already running (PID: ${runningPid})`);
        logger.info('Run "autopilot stop" to stop the current instance.');
        process.exit(EXIT_CODES.WATCHER_ALREADY_RUNNING);
      }
      return;
    }

    // Initialize watcher
    const watcher = new Watcher(repoPath);

    if (!isJson) {
      logger.section('Starting Autopilot');
      logger.info('Press Ctrl+C to stop, or run "autopilot stop" in another terminal.');
    } else {
      console.log(JSON.stringify({ status: 'starting' }));
    }
    
    // Start watching
    await watcher.start();

    // Keep process alive is handled by chokidar being persistent
    // The watcher handles process signals for cleanup

  } catch (error) {
    if (isJson) {
      console.log(JSON.stringify({ error: error.message }));
      process.exit(EXIT_CODES.GENERAL_ERROR);
    } else {
      logger.error(`Failed to start autopilot: ${error.message}`);
      process.exit(EXIT_CODES.GENERAL_ERROR);
    }
  }
};

module.exports = start;
