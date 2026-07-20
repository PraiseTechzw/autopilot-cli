/**
 * Command: stop
 * Stops the running Autopilot instance
 */

const fs = require('fs');
const path = require('path');
const process = require('process');
const logger = require('../utils/logger');
const { getRunningPid, removePid } = require('../utils/process');
const EXIT_CODES = require('../utils/exit-codes');

const stop = async () => {
  const repoPath = process.cwd();

  try {
    const pid = await getRunningPid(repoPath);

    if (!pid) {
      logger.info('Autopilot is not running.');
      // Clean up stale PID file just in case
      await removePid(repoPath);
      process.exit(EXIT_CODES.SUCCESS);
      return;
    }

    logger.info(`Stopping Autopilot (PID: ${pid})...`);

    try {
      // Send SIGTERM to the process
      process.kill(pid, 'SIGTERM');
      
      logger.success('Autopilot stopped successfully.');
      
      // Cleanup files
      await removePid(repoPath);
      
      const statePath = path.join(repoPath, '.autopilot-state.json');
      const logPath = path.join(repoPath, '.autopilot.log');
      
      if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
      if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
      
    } catch (error) {
      if (error.code === 'ESRCH') {
        logger.warn('Process not found (stale PID file). Cleaning up...');
        await removePid(repoPath);
        logger.success('Cleaned up stale lock file.');
      } else {
        logger.error(`Failed to stop process: ${error.message}`);
        process.exit(EXIT_CODES.GENERAL_ERROR);
      }
    }

  } catch (error) {
    logger.error(`Error stopping autopilot: ${error.message}`);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
};

module.exports = stop;

