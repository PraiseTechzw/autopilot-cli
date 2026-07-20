/**
 * Process management utilities
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const { ensureConfigDir } = require('./paths');

/**
 * Get path to PID file for a repository or global
 * @param {string} [repoPath] - Repository path
 * @returns {string} PID file path
 */
const getPidPath = (repoPath) => {
  if (repoPath) {
    return path.join(repoPath, '.autopilot.pid');
  }
  // Fallback to global pid if needed, though mostly used per-repo
  return path.join(require('os').homedir(), '.autopilot', 'autopilot.pid');
};

/**
 * Save current process PID to file
 * @param {string} repoPath - Repository path
 */
const savePid = async (repoPath) => {
  try {
    const pidPath = getPidPath(repoPath);
    await fs.writeFile(pidPath, process.pid.toString());
  } catch (error) {
    logger.error(`Failed to save PID file: ${error.message}`);
  }
};

/**
 * Remove PID file
 * @param {string} repoPath - Repository path
 */
const removePid = async (repoPath) => {
  try {
    const pidPath = getPidPath(repoPath);
    if (await fs.pathExists(pidPath)) {
      await fs.remove(pidPath);
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
};

/**
 * Check if a process is running
 * @param {number} pid - Process ID
 * @returns {boolean} True if running
 */
const isProcessRunning = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Read PID from file and check if running
 * @param {string} repoPath - Repository path
 * @returns {Promise<number|null>} PID if running, null otherwise
 */
const getRunningPid = async (repoPath) => {
  try {
    const pidPath = getPidPath(repoPath);
    if (await fs.pathExists(pidPath)) {
      const pid = parseInt(await fs.readFile(pidPath, 'utf-8'), 10);
      if (isProcessRunning(pid)) {
        return pid;
      }
      // Stale PID file
      await removePid(repoPath);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Register process signal handlers for graceful shutdown
 * @param {Function} cleanupFn - Async cleanup function to run on exit
 */
const registerProcessHandlers = (cleanupFn) => {
  let cleaningUp = false;

  const handleSignal = async (signal) => {
    if (cleaningUp) return;
    cleaningUp = true;

    logger.info(`Received ${signal}, shutting down...`);
    
    try {
      if (cleanupFn) {
        await cleanupFn();
      }
    } catch (error) {
      logger.error(`Error during cleanup: ${error.message}`);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
  
  // Handle uncaught errors to try to cleanup if possible
  process.on('uncaughtException', async (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    logger.error(error.stack);
    if (!cleaningUp) {
      cleaningUp = true;
      try {
        if (cleanupFn) await cleanupFn();
      } catch (e) {
        // Ignore
      }
      process.exit(1);
    }
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
};

module.exports = {
  savePid,
  removePid,
  getRunningPid,
  isProcessRunning,
  registerProcessHandlers
};
