const fs = require('fs-extra');
const path = require('path');
const { getPidFile, getStateFile, ensureConfigDir } = require('./paths');
const logger = require('./logger');

const getRepoPidPath = (repoPath) => {
  if (repoPath) {
    return path.join(repoPath, '.autopilot.pid');
  }
  return getPidFile();
};

const savePid = async (pid, repoPath) => {
  try {
    if (!repoPath) {
      await ensureConfigDir();
    }
    const pidPath = getRepoPidPath(repoPath);
    await fs.writeFile(pidPath, pid.toString());
  } catch (error) {
    logger.error(`Failed to save PID: ${error.message}`);
  }
};

const readPid = async (repoPath) => {
  try {
    const pidPath = getRepoPidPath(repoPath);
    if (await fs.pathExists(pidPath)) {
      const pid = await fs.readFile(pidPath, 'utf-8');
      return parseInt(pid, 10);
    }
    return null;
  } catch (error) {
    return null;
  }
};

const removePid = async (repoPath) => {
  try {
    const pidPath = getRepoPidPath(repoPath);
    await fs.remove(pidPath);
  } catch (error) {
    // Swallow errors on shutdown
  }
};

const isProcessRunning = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
};

const saveState = async (state) => {
  try {
    await ensureConfigDir();
    await fs.writeJson(getStateFile(), state, { spaces: 2 });
  } catch (error) {
    logger.error(`Failed to save state: ${error.message}`);
  }
};

const readState = async () => {
  try {
    if (await fs.pathExists(getStateFile())) {
      return await fs.readJson(getStateFile());
    }
    return null;
  } catch (error) {
    return null;
  }
};

const registerProcessHandlers = (cleanup) => {
  const handle = async (signal) => {
    try {
      if (typeof cleanup === 'function') {
        await cleanup(signal);
      }
    } catch (error) {
      logger.error(`Shutdown error: ${error.message}`);
    } finally {
      if (signal) {
        process.exit(0);
      }
    }
  };

  process.on('SIGINT', () => handle('SIGINT'));
  process.on('SIGTERM', () => handle('SIGTERM'));
  process.on('uncaughtException', (error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    handle('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    logger.error(`Unhandled rejection: ${message}`);
    handle('unhandledRejection');
  });
  process.on('exit', () => {
    if (typeof cleanup === 'function') {
      cleanup('exit');
    }
  });
};

module.exports = {
  savePid,
  readPid,
  removePid,
  isProcessRunning,
  saveState,
  readState,
  registerProcessHandlers,
};
