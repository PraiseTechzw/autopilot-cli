const fs = require('fs-extra');
const logger = require('../utils/logger');
const Watcher = require('../core/watcher');
const { readPid, removePid, isProcessRunning } = require('../utils/process');

async function startWatcher() {
  const repoPath = process.cwd();

  try {
    const existingPid = await readPid(repoPath);
    if (existingPid && isProcessRunning(existingPid)) {
      logger.warn(`Autopilot already running (PID ${existingPid}). Use "autopilot stop".`);
      return;
    }

    if (existingPid && !isProcessRunning(existingPid)) {
      await removePid(repoPath);
    }

    const watcher = new Watcher(repoPath);
    await watcher.start();

    logger.info('Press Ctrl+C to stop, or run "autopilot stop" in another terminal.');
  } catch (error) {
    logger.error(`Failed to start watcher: ${error.message}`);
  }
}

module.exports = { startWatcher };
