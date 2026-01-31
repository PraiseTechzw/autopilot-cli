const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { readPid, isProcessRunning } = require('../utils/process');

async function statusWatcher() {
  const repoPath = process.cwd();

  try {
    const pid = await readPid(repoPath);
    if (!pid) {
      logger.warn('Autopilot is not running.');
      return;
    }

    const running = isProcessRunning(pid);
    if (!running) {
      logger.warn(`Autopilot is not running (stale PID ${pid}).`);
      return;
    }

    logger.success(`Autopilot is running (PID ${pid}).`);

    const logPath = path.join(repoPath, 'autopilot.log');
    if (await fs.pathExists(logPath)) {
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(Boolean);
      if (lines.length) {
        logger.info(`Last log: ${lines[lines.length - 1]}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to read status: ${error.message}`);
  }
}

module.exports = { statusWatcher };
