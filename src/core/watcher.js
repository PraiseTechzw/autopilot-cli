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
const { generateCommitMessage, addTrailers } = require('./commit');
const eventSystem = require('./events');
const { getIdentity } = require('../utils/identity');
const { version } = require('../../package.json');
const { savePid, removePid, registerProcessHandlers } = require('../utils/process');
const { loadConfig } = require('../config/loader');
const { readIgnoreFile, createIgnoredFilter, normalizePath } = require('../config/ignore');
const HistoryManager = require('./history');
const StateManager = require('./state');
const { validateBeforeCommit, checkTeamStatus, isProtectedBranch } = require('./safety');
const { syncLeaderboard } = require('../commands/leaderboard');
const { validateConfig } = require('./configValidator');
const { notify } = require('./notifier');
const RetryQueue = require('./retryQueue');

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
    this.logFilePath = path.join(repoPath, '.autopilot.log');
    this.ignorePatterns = [];
    this.ignoredFilter = null;
    this.focusEngine = new FocusEngine(repoPath);
    this.historyManager = new HistoryManager(repoPath);
    this.stateManager = new StateManager(repoPath);
    this.retryQueue = new RetryQueue(repoPath, git.push.bind(git));
    this.statePath = path.join(repoPath, '.autopilot-state.json');
    this.startedAt = Date.now();
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
      logger.setTargetPath(this.repoPath);
      await savePid(this.repoPath);
      
      logger.info('Starting Autopilot watcher...');
      
      // Load configuration
      await this.reloadConfig();
      
      // Validate configuration
      const validation = validateConfig(this.config);
      if (!validation.valid) {
        logger.error(`Config error: ${validation.errors[0]}. Fix your .autopilotrc.json and try again.`);
        process.exit(1);
      }

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
          stabilityThreshold: 200,
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
      
      // Heartbeat to update status file (for uptime/queue length)
      this.heartbeatTimer = setInterval(() => {
        this.updateStatusFile();
      }, 5000);
      
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
      
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }
      
      if (this.focusEngine) {
        await this.focusEngine.stop();
      }

      await removePid(this.repoPath);
      
      // Cleanup files
      if (fs.existsSync(this.statePath)) fs.unlinkSync(this.statePath);
      if (fs.existsSync(this.logFilePath)) {
          // Tell logger to stop writing to this file before deleting it
          logger.setTargetPath(null);
          fs.unlinkSync(this.logFilePath);
      }
      
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
        logger.debug(`Ignoring filtered path: ${relativePath}`);
        return;
    }

    // Additional strict check for critical files just in case
    if (relativePath.includes('.git/') || relativePath.includes('.autopilot/') || relativePath.includes('autopilot.log') || relativePath.includes('.autopilot-state.json')) {
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
    // Prioritize debounceSeconds if explicitly set, otherwise use debounceMs
    let debounceMs = 20000;
    if (this.config.debounceSeconds !== undefined) {
        debounceMs = this.config.debounceSeconds * 1000;
    } else if (this.config.debounceMs !== undefined) {
        debounceMs = this.config.debounceMs;
    }
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

    logger.debug(`Debounce scheduled for ${debounceMs}ms. Timer ID exists: ${!!this.debounceTimer}`);
    
    this.debounceTimer = setTimeout(() => {
      logger.debug(`Debounce timer reached (${debounceMs}ms). Processing...`);
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
      logger.debug('Starting processChanges cycle...');
    logger.debug('Checking git status...');

      // 0. Pause Check
      if (this.stateManager.isPaused()) {
        const state = this.stateManager.getState();
        logger.debug(`Skipping processing: Autopilot is paused (${state.reason})`);
        return;
      }

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

      // Update state: processing
      await this.updateStatusFile({ status: 'committing' });

      // 3. Safety: Branch check
      const branch = await git.getBranch(this.repoPath);
      if (this.config?.blockedBranches?.includes(branch)) {
        logger.warn(`Skip commit: Branch '${branch}' is blocked`);
        return;
      }

      // 4. Safety: Team Mode & Remote check
      logger.debug('Checking team/remote status...');
      // Note: checkTeamStatus in safety.js also does pull --rebase if configured.
      // But our updated git.push also handles it. We'll rely on git.push for the main logic
      // but keep checkTeamStatus for initial safety.
      const teamStatus = await checkTeamStatus(this.repoPath, this.config);
      if (!teamStatus.ok) {
        logger.warn('Skip commit: Team check failed (Remote ahead or conflict).');
        await this.updateStatusFile({ conflicts: 'Detected during team check' });
        notify('conflict', { branch }, this.config.notificationsEnabled);
        return;
      }

      // 5. Safety: Pre-commit checks (Validation)
      logger.debug('Running pre-commit validation...');
      const validation = await validateBeforeCommit(this.repoPath, this.config);
      if (!validation.ok) {
        logger.warn('Skip commit: Pre-commit validation failed:');
        validation.errors.forEach(e => logger.error(`- ${e}`));
        return;
      }

      // 6. Safety: Custom checks (Legacy)
      if (this.config?.requireChecks) {
        const checksPassed = await this.runChecks();
        if (!checksPassed) {
          logger.warn('Skip commit: Checks failed');
          return;
        }
      }

      // 7. Commit
      logger.info('Committing changes...');
      
      // Add all changes
      await git.addAll(this.repoPath);
      
      const changedFiles = statusObj.files;
      let message = 'update: auto-commit changes';

      // Always use AI if enabled, otherwise fallback to rule-based (handled in generateCommitMessage)
      const diff = await git.getDiff(this.repoPath, true); // Staged diff
      message = await generateCommitMessage(changedFiles, diff, this.config);

      // Add Trust/Attribution Trailers
      message = await addTrailers(message);

      const commitResult = await git.commit(this.repoPath, message);
      
      if (commitResult.ok) {
        this.lastCommitAt = Date.now();
        this.focusEngine.onCommit();
        
        const hash = await git.getLatestCommitHash(this.repoPath);
        
        // Record history
        try {
          if (hash) {
            this.historyManager.addCommit({
              hash,
              message,
              files: changedFiles.map(f => f.file)
            });
          }
        } catch (err) {
          logger.error(`Failed to record history: ${err.message}`);
        }
        
        await this.updateStatusFile({
          lastCommitHash: hash,
          lastCommitMessage: message,
          lastCommitAt: Date.now()
        });

        logger.success('Commit complete');
      } else {
        logger.error(`Commit failed: ${commitResult.stderr}`);
        return;
      }

      // 7. Auto-push
      if (this.config?.autoPush) {
        logger.info('Pushing to remote...');
        
        // Protected branch check
        if (isProtectedBranch(branch, this.config) && !this.config.allowPushToProtected) {
          logger.warn(`Autopilot paused — direct push to ${branch} is blocked. Set allowPushToProtected: true in .autopilotrc.json to override.`);
          await this.updateStatusFile({ status: 'watching', branch: `${branch} (PROTECTED)` });
          return;
        }

        await this.updateStatusFile({ status: 'pushing' });
        const pushResult = await git.push(this.repoPath, branch);
        
        if (!pushResult.ok) {
          if (pushResult.conflict) {
             logger.error('Rebase conflict detected — manual intervention required');
             this.stateManager.pause(`Conflict in ${branch}`);
             await this.updateStatusFile({ status: 'paused', conflicts: `Conflict in ${branch}` });
             notify('conflict', { branch }, this.config.notificationsEnabled);
             return;
          }

          logger.warn(`Push failed: ${pushResult.stderr}. Queuing for retry.`);
          const latestHash = await git.getLatestCommitHash(this.repoPath);
          this.retryQueue.add({
            commitHash: latestHash,
            branch: branch,
            maxAttempts: this.config.maxRetryAttempts || 5
          });
          
          await this.updateStatusFile({ 
            status: 'watching', 
            lastPushStatus: 'queued',
            queueLength: this.retryQueue.queue.length 
          });
          notify('push_failed', {}, this.config.notificationsEnabled);
        } else {
          logger.success('Push complete');
          const latestHash = await git.getLatestCommitHash(this.repoPath);
          
          await this.updateStatusFile({ 
            status: 'watching', 
            lastPushHash: latestHash,
            lastPushStatus: 'succeeded',
            lastPushAt: Date.now()
          });
          notify('push_success', { commitMessage: message }, this.config.notificationsEnabled);

          // Emit Event for Leaderboard/Telemetry
          try {
            const identity = await getIdentity();
            await eventSystem.emit({
              type: 'push_success',
              userId: identity.id,
              commitHash: latestHash,
              timestamp: Date.now(),
              version: version
            });
          } catch (err) {
            logger.debug(`Failed to emit push event: ${err.message}`);
          }
        }
      }
      
      // Cleanup
      await this.updateStatusFile({ status: 'watching' });
      
      // Sync leaderboard
      try {
        const apiUrl = process.env.AUTOPILOT_API_URL || 'https://autopilot-cli.vercel.app';
        await syncLeaderboard(apiUrl, { cwd: this.repoPath });
      } catch (err) {
        logger.debug(`Leaderboard sync failed: ${err.message}`);
      }

    } catch (error) {
      logger.error(`Process error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
  /**
   * Update the external status file for the status command
   */
  async updateStatusFile(updates = {}) {
    try {
      let state = {};
      if (fs.existsSync(this.statePath)) {
        state = fs.readJsonSync(this.statePath);
      }

      if (!this.startedAt) this.startedAt = Date.now();

      const branch = await git.getBranch(this.repoPath);
      const uptime = Math.floor((Date.now() - this.startedAt) / 1000);
      
      const newState = {
        pid: process.pid,
        startedAt: new Date(this.startedAt).toISOString(),
        branch: branch,
        isProtected: isProtectedBranch(branch, this.config),
        status: updates.status || state.status || 'watching',
        lastCommit: updates.lastCommit || state.lastCommit || null,
        lastPush: updates.lastPush || state.lastPush || null,
        queueLength: this.retryQueue ? this.retryQueue.queue.length : 0,
        conflicts: !!(updates.conflicts || state.conflicts),
        watchPath: this.repoPath,
        uptime: uptime
      };

      // Handle special updates like lastCommitHash/Message to the new structure
      if (updates.lastCommitHash) {
        newState.lastCommit = {
          hash: updates.lastCommitHash,
          message: updates.lastCommitMessage,
          timestamp: new Date(updates.lastCommitAt || Date.now()).toISOString()
        };
      }

      if (updates.lastPushStatus) {
        newState.lastPush = {
          hash: updates.lastPushHash || (newState.lastCommit ? newState.lastCommit.hash : null),
          success: updates.lastPushStatus === 'succeeded',
          timestamp: new Date(updates.lastPushAt || Date.now()).toISOString()
        };
      }

      fs.writeJsonSync(this.statePath, newState, { spaces: 2 });
    } catch (err) {
      // Don't fail the watcher if status file write fails
      logger.debug(`Failed to update status file: ${err.message}`);
    }
  }
}

module.exports = Watcher;
