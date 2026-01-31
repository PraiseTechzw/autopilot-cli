/**
 * Autopilot Watcher Engine
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const logger = require('../utils/logger');
const git = require('./git');
const { generateCommitMessage } = require('./commit');
const { savePid, removePid, registerProcessHandlers } = require('../utils/process');
const { loadConfig } = require('../config/loader');
const { readIgnoreFile, createIgnoredFilter, normalizePath } = require('../config/ignore');

class Watcher {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.config = null;
    this.watcher = null;
    this.isWatching = false;
    this.isProcessing = false;
    this.debounceTimer = null;
    this.lastCommitAt = 0;
    this.logFilePath = path.join(repoPath, 'autopilot.log');
    this.ignorePatterns = [];
  }

  logVerbose(message) {
    // Helper to log debug messages to file/stdout if needed
    // For now, we use logger.debug which writes to stdout if DEBUG is set
    // We also want to ensure we don't create a loop by logging to the file we watch
    // But since we ignore autopilot.log, it should be fine.
    logger.debug(message);
    // TODO: Append to log file if configured
  }

  async reloadConfig() {
    this.config = await loadConfig(this.repoPath);
  }

  async reloadIgnore() {
    this.ignorePatterns = await readIgnoreFile(this.repoPath);
  }

  /**
   * Initialize and start the watcher
   */
  async start() {
    try {
      if (this.isWatching) {
        logger.warn('Watcher is already running');
        return;
      }

      // Initialize environment
      await fs.ensureFile(this.logFilePath);
      await savePid(this.repoPath);
      
      logger.info('Starting Autopilot watcher...');
      
      // Load configuration
      await this.reloadConfig();
      await this.reloadIgnore();

      // Initial safety check
      const currentBranch = await git.getBranch(this.repoPath);
      if (currentBranch && this.config.blockedBranches?.includes(currentBranch)) {
        logger.error(`Branch '${currentBranch}' is blocked in config. Stopping.`);
        await this.stop();
        return;
      }

      // Create robust ignore filter
      const ignoredFilter = createIgnoredFilter(this.repoPath, this.ignorePatterns);

      // Start Chokidar with function-based ignore
      this.watcher = chokidar.watch(this.repoPath, {
        ignored: ignoredFilter,
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100,
        }
      });

      this.watcher
        .on('add', (path) => this.onFsEvent('add', path))
        .on('change', (path) => this.onFsEvent('change', path))
        .on('unlink', (path) => this.onFsEvent('unlink', path))
        .on('error', (error) => this.handleError(error));

      // Handle process signals
      registerProcessHandlers(async () => {
        await this.stop();
      });

      this.isWatching = true;
      logger.success(`Autopilot is watching ${this.repoPath}`);
      logger.info(`Logs: ${this.logFilePath}`);
      
      // Test Mode Support
      if (process.env.AUTOPILOT_TEST_MODE) {
        logger.warn('TEST MODE: Running in dry-run mode for 8 seconds...');
        setTimeout(async () => {
          logger.info('TEST MODE: Auto-stopping watcher...');
          await this.stop();
          process.exit(0);
        }, 8000);
      }
      
    } catch (error) {
      logger.error(`Failed to start watcher: ${error.message}`);
      await this.stop();
    }
  }

  /**
   * Stop the watcher
   */
  async stop() {
    try {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }

      await removePid(this.repoPath);
      this.isWatching = false;
      logger.info('Watcher stopped');
    } catch (error) {
      logger.error(`Error stopping watcher: ${error.message}`);
    }
  }

  /**
   * Handle filesystem events
   */
  onFsEvent(type, filePath) {
    if (this.isProcessing) return;
    
    // Normalize path relative to repo for logging and checks
    const relativePath = normalizePath(path.relative(this.repoPath, filePath));
    
    // Double check ignore (safety net) - although chokidar should catch most
    if (relativePath.includes('.git/') || relativePath.endsWith('autopilot.log') || relativePath.includes('.vscode/')) {
        return;
    }

    this.logVerbose(`File event: ${type} ${relativePath}`);
    this.scheduleProcess();
  }

  /**
   * Schedule processing with debounce
   */
  scheduleProcess() {
    const debounceMs = (this.config?.debounceSeconds || 5) * 1000;
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    logger.debug('Debounce fired. Waiting...');
    
    this.debounceTimer = setTimeout(() => {
      this.processChanges();
    }, debounceMs);
  }

  handleError(error) {
    logger.error(`Watcher error: ${error.message}`);
  }

  async runChecks() {
    // Placeholder for custom checks
    return true;
  }

  /**
   * Main processing loop
   */
  async processChanges() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      logger.debug('Checking git status...');

      // 1. Min interval check
      const now = Date.now();
      const minInterval = (this.config?.minSecondsBetweenCommits || 180) * 1000;
      if (this.lastCommitAt > 0 && now - this.lastCommitAt < minInterval) {
        logger.debug(`Skip commit: Minimum interval not met (${Math.round((minInterval - (now - this.lastCommitAt))/1000)}s remaining)`);
        return;
      }

      // 2. Check if dirty
      const statusObj = await git.getPorcelainStatus(this.repoPath);
      const isDirty = statusObj.ok && statusObj.files.length > 0;
      logger.debug(`Git dirty: ${isDirty}`);

      if (!isDirty) {
        return;
      }

      // 3. Safety: Branch check
      const branch = await git.getBranch(this.repoPath);
      if (this.config?.blockedBranches?.includes(branch)) {
        logger.warn(`Skip commit: Branch '${branch}' is blocked`);
        return;
      }

      // 4. Safety: Remote check (fetch -> behind?)
      logger.debug('Checking remote status...');
      // Note: isRemoteAhead might need network, timeout safely?
      try {
          const remoteStatus = await git.isRemoteAhead(this.repoPath);
          if (remoteStatus.behind) {
            logger.warn('Skip commit: Local branch is behind remote. Please pull changes.');
            return;
          }
      } catch (e) {
          logger.debug(`Remote check failed (offline?): ${e.message}`);
      }

      // 5. Safety: Custom checks
      if (this.config?.requireChecks) {
        const checksPassed = await this.runChecks();
        if (!checksPassed) {
          logger.warn('Skip commit: Checks failed');
          return;
        }
      }

      // 6. Commit
      logger.info('Committing changes...');
      
      // Add all changes
      await git.addAll(this.repoPath);
      
      // Generate message
      const changedFiles = statusObj.files;
      const message = this.config?.commitMessageMode === 'simple' 
        ? 'chore: auto-commit changes'
        : generateCommitMessage(changedFiles);

      await git.commit(this.repoPath, message);
      this.lastCommitAt = Date.now();
      logger.success('Commit done');

      // 7. Auto-push
      if (this.config?.autoPush) {
        logger.info('Pushing to remote...');
        await git.push(this.repoPath);
        logger.success('Push complete');
      }

    } catch (error) {
      logger.error(`Process error: ${error.message}`);
    } finally {
      this.isProcessing = false;
      this.debounceTimer = null;
    }
  }
}

module.exports = Watcher;
