/**
 * Command: stop
 * Stops the running Autopilot instance
 */

const process = require('process');
const logger = require('../utils/logger');
const { getRunningPid, removePid } = require('../utils/process');

const stop = async () => {
  const repoPath = process.cwd();

  try {
    const pid = await getRunningPid(repoPath);

    if (!pid) {
      logger.info('Autopilot is not running.');
      // Clean up stale PID file just in case
      await removePid(repoPath);
      return;
    }

    logger.info(`Stopping Autopilot (PID: ${pid})...`);

    try {
      // Send SIGTERM to the process
      process.kill(pid, 'SIGTERM');
      
      logger.success('Autopilot stopped successfully.');
      
      // Cleanup PID file
      await removePid(repoPath);
      
    } catch (error) {
      if (error.code === 'ESRCH') {
        logger.warn('Process not found (stale PID file). Cleaning up...');
        await removePid(repoPath);
        logger.success('Cleaned up stale lock file.');
      } else {
        logger.error(`Failed to stop process: ${error.message}`);
      }
    }

  } catch (error) {
    logger.error(`Error stopping autopilot: ${error.message}`);
    process.exit(1);
  }
};

module.exports = stop;
