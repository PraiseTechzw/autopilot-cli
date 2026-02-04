/**
 * Autopilot Watcher Engine
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const readline = require('readline');
const logger = require('../utils/logger');
const git = require('./git');
const FocusEngine = require('./focus');
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
    this.maxWaitTimer = null;
    this.firstChangeTime = null;
    this.lastCommitAt = 0;
    this.logFilePath = path.join(repoPath, 'autopilot.log');
    this.ignorePatterns = [];
    this.ignoredFilter = null;
    this.focusEngine = new FocusEngine(repoPath);
  }

  logVerbose(message) {
    // Helper to log debug messages
    logger.debug(message);
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

      // Create robust ignore filter and store it
      this.ignoredFilter = createIgnoredFilter(this.repoPath, this.ignorePatterns);

      // Start Chokidar with function-based ignore
      this.watcher = chokidar.watch(this.repoPath, {
        ignored: this.ignoredFilter,
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
        logger.warn('TEST MODE: Running in foreground for test duration...');
        // In test mode, we might want to exit after some time or wait for signal
        // The user requirement says "auto-exits after configurable seconds"
        const testDuration = process.env.AUTOPILOT_TEST_DURATION || 10000;
        setTimeout(async () => {
          logger.info('TEST MODE: Auto-stopping watcher...');
          await this.stop();
          process.exit(0);
        }, Number(testDuration));
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
      
      if (this.maxWaitTimer) {
        clearTimeout(this.maxWaitTimer);
        this.maxWaitTimer = null;
      }

      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }
      
      if (this.focusEngine) {
        await this.focusEngine.stop();
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
    // normalizePath ensures forward slashes
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.repoPath, filePath);
    const relativePath = normalizePath(path.relative(this.repoPath, absolutePath));
    
    // Internal Ignore Check (Redundant but safe)
    // We use the same filter function passed to Chokidar
    if (this.ignoredFilter && this.ignoredFilter(absolutePath)) {
        return;
    }

    // Additional strict check for critical files just in case
    if (relativePath.includes('.git/') || relativePath.endsWith('autopilot.log')) {
        return;
    }

    this.logVerbose(`Change detected: ${type} ${relativePath}`);
    
    // Track focus
    this.focusEngine.onFileEvent(relativePath);

    this.scheduleProcess();
  }

  /**
   * Schedule processing with debounce
   */
  scheduleProcess() {
    const debounceMs = (this.config?.debounceSeconds || 5) * 1000;
    const maxWaitMs = (this.config?.maxWaitSeconds || 60) * 1000; // Default 60s max wait
    
    // Reset debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Start Max Wait timer if not running
    if (!this.firstChangeTime) {
      this.firstChangeTime = Date.now();
      logger.debug(`Starting max wait timer (${maxWaitMs}ms)`);
      
      this.maxWaitTimer = setTimeout(() => {
        logger.debug('Max wait reached. Forcing process.');
        this.processChanges();
      }, maxWaitMs);
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

  async askApproval(message) {
      const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
      });

      return new Promise((resolve) => {
          logger.info(`Proposed commit message: "${message}"`);
          rl.question('Accept? (y/n/edit): ', (answer) => {
              rl.close();
              const ans = answer.toLowerCase();
              if (ans === 'y' || ans === 'yes') {
                  resolve({ approved: true, message });
              } else if (ans === 'edit') {
                   const rlEdit = readline.createInterface({ input: process.stdin, output: process.stdout });
                   rlEdit.question('Enter new message: ', (newMessage) => {
                       rlEdit.close();
                       resolve({ approved: true, message: newMessage });
                   });
              } else {
                  resolve({ approved: false });
              }
          });
      });
  }

  /**
   * Main processing loop
   */
  async processChanges() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Clear timers
    if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
    }
    if (this.maxWaitTimer) {
        clearTimeout(this.maxWaitTimer);
        this.maxWaitTimer = null;
    }
    this.firstChangeTime = null;

    try {
      logger.debug('Checking git status...');

      // 1. Min interval check
      const now = Date.now();
      const minInterval = (this.config?.minSecondsBetweenCommits || 30) * 1000;
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
      const remoteStatus = await git.isRemoteAhead(this.repoPath);
      if (remoteStatus.behind) {
        logger.warn('Skip commit: Local branch is behind remote. Please pull changes.');
        return;
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
      let message = 'chore: auto-commit changes';

      if (this.config?.commitMessageMode !== 'simple') {
        const diff = await git.getDiff(this.repoPath, true); // Staged diff
        message = await generateCommitMessage(changedFiles, diff, this.config);
      }

      // Interactive Review (Skip in test mode if not mocked)
      if (this.config?.ai?.interactive && !process.env.AUTOPILOT_TEST_MODE) {
        const approval = await this.askApproval(message);
        if (!approval.approved) {
          logger.warn('Commit skipped by user.');
          return;
        }
        message = approval.message;
      }

      await git.commit(this.repoPath, message);
      this.lastCommitAt = Date.now();
      this.focusEngine.onCommit();
      logger.success('Commit complete');

      // 7. Auto-push
      if (this.config?.autoPush) {
        logger.info('Pushing to remote...');
        const pushResult = await git.push(this.repoPath);
        if (!pushResult.ok) {
             logger.warn(`Push failed (will retry next time): ${pushResult.stderr}`);
        } else {
             logger.success('Push complete');
        }
      }

    } catch (error) {
      logger.error(`Process error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = Watcher;
