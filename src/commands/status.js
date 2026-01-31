/**
 * Command: status
 * Checks the status of the Autopilot watcher
 */

const fs = require('fs-extra');
const path = require('path');
const process = require('process');
const logger = require('../utils/logger');
const { getRunningPid } = require('../utils/process');

const status = async () => {
  const repoPath = process.cwd();

  try {
    const pid = await getRunningPid(repoPath);

    logger.section('Autopilot Status');

    if (pid) {
      logger.success(`Status: Running`);
      logger.info(`PID: ${pid}`);
    } else {
      logger.warn('Status: Not Running');
    }

    // Show recent logs if available
    const logPath = path.join(repoPath, 'autopilot.log');
    if (await fs.pathExists(logPath)) {
      logger.section('Recent Logs');
      try {
        const logs = await fs.readFile(logPath, 'utf-8');
        const lines = logs.trim().split('\n');
        const lastLines = lines.slice(-5); // Show last 5 lines
        
        if (lastLines.length > 0) {
          lastLines.forEach(line => console.log(line));
        } else {
          console.log('(Log file is empty)');
        }
        
        logger.info(`\nFull log: ${logPath}`);
      } catch (error) {
        logger.error(`Could not read log file: ${error.message}`);
      }
    } else {
      logger.info('No log file found.');
    }

  } catch (error) {
    logger.error(`Error checking status: ${error.message}`);
    process.exit(1);
  }
};

module.exports = status;
