const { execa } = require('execa');
const logger = require('../utils/logger');
const { readPid, removePid, isProcessRunning } = require('../utils/process');

async function stopWatcher() {
  const repoPath = process.cwd();

  try {
    const pid = await readPid(repoPath);
    if (!pid) {
      logger.warn('Autopilot is not running.');
      return;
    }

    if (!isProcessRunning(pid)) {
      await removePid(repoPath);
      logger.warn('Found stale PID file. Removed.');
      return;
    }

    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      if (process.platform === 'win32') {
        await execa('taskkill', ['/PID', String(pid), '/T', '/F'], { reject: false });
      } else {
        throw error;
      }
    }

    await removePid(repoPath);
    logger.success(`Stopped autopilot (PID ${pid}).`);
  } catch (error) {
    logger.error(`Failed to stop autopilot: ${error.message}`);
  }
}

module.exports = { stopWatcher };
