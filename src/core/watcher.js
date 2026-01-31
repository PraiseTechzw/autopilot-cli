/**
 * Autopilot Watcher Engine
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const { execa } = require('execa');
const logger = require('../utils/logger');
const git = require('./git');
const { generateCommitMessage } = require('./commit');
const { getIgnorePath } = require('../utils/paths');
const { savePid, removePid, registerProcessHandlers } = require('../utils/process');
const { loadConfig } = require('../config/loader');

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
      
      this.logVerbose('Starting Autopilot watcher...');
      
      // Load configuration
      await this.reloadConfig();
      await this.reloadIgnore();

      // Initial safety check
      const currentBranch = await git.getBranch(this.repoPath);
      if (currentBranch && this.config.blockedBranches?.includes(currentBranch)) {
        logger.error(`Branch '${currentBranch}' is blocked in config. Stopping.`);
        this.logVerbose(`Blocked branch detected: ${currentBranch}`);
        await this.stop();
        return;
      }

      // Combine defaults + loaded patterns
      const finalIgnored = [
        ...this.ignorePatterns,
        /(^|[\/\\])\.git([\/\\]|$)/, // Regex for .git folder
        '**/autopilot.log',
        '**/.autopilot.pid',
        'node_modules' // Sensible default
      ];

      // Start Chokidar
      this.watcher = chokidar.watch(this.repoPath, {
        ignored: finalIgnored,
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
      
    } catch (error) {
      logger.error(`Failed to start watcher: ${error.message}`);
      this.logVerbose(`Start error: ${error.stack}`);
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
    
    // Double check ignore (safety net)
    if (filePath.includes('.git') || filePath.endsWith('autopilot.log')) return;

    this.logVerbose(`File event: ${type} ${filePath}`);
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

    this.debounceTimer = setTimeout(() => {
      this.processChanges();
    }, debounceMs);
  }

  /**
   * Main processing loop
   */
  async processChanges() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Min interval check
      const now = Date.now();
      const minInterval = (this.config?.minIntervalSeconds || 30) * 1000;
      if (now - this.lastCommitAt < minInterval) {
        this.logVerbose('Skipping: Minimum interval not met');
        return;
      }

      // 2. Safety: Branch check
      const branch = await git.getBranch(this.repoPath);
      if (this.config?.blockedBranches?.includes(branch)) {
        logger.warn(`Current branch '${branch}' is blocked. Skipping.`);
        return;
      }

      // 3. Safety: Remote check (fetch -> behind?)
      this.logVerbose('Checking remote status...');
      const remoteStatus = await git.isRemoteAhead(this.repoPath);
      if (remoteStatus.behind) {
        logger.warn('Local branch is behind remote. Please pull changes.');
        this.logVerbose('Behind remote. Pausing auto-commit.');
        return;
      }

      // 4. Safety: Custom checks
      if (this.config?.requireChecks) {
        const checksPassed = await this.runChecks();
        if (!checksPassed) {
          logger.warn('Checks failed. Skipping commit.');
          return;
        }
      }

      // 5. Flow: Status -> Add -> Commit -> Push
      const status = await git.getPorcelainStatus(this.repoPath);
      if (!status.ok || status.files.length === 0) {
        this.logVerbose('No changes to commit');
        return;
      }

      this.logVerbose(`Detecting ${status.files.length} changed files`);
      
      // Add all
      await git.addAll(this.repoPath);
      
      // Generate message
      const message = generateCommitMessage(status.files);
      this.logVerbose(`Generated message: ${message}`);
      
      // Commit
      const commitResult = await git.commit(this.repoPath, message);
      if (commitResult.ok) {
        logger.success(`Committed: ${message}`);
        this.lastCommitAt = Date.now();

        // Push if enabled
        if (this.config?.autoPush) {
          logger.info('Pushing to remote...');
          const pushResult = await git.push(this.repoPath, branch);
          if (pushResult.ok) {
            logger.success('Pushed successfully');
          } else {
            logger.error(`Push failed: ${pushResult.stderr}`);
            this.logVerbose(`Push error: ${pushResult.stderr}`);
          }
        }
      } else {
        logger.error(`Commit failed: ${commitResult.stderr}`);
        this.logVerbose(`Commit error: ${commitResult.stderr}`);
      }

    } catch (error) {
      logger.error(`Process error: ${error.message}`);
      this.logVerbose(`Process exception: ${error.stack}`);
    } finally {
      this.isProcessing = false;
      this.debounceTimer = null;
    }
  }

  /**
   * Run user-defined checks
   */
  async runChecks() {
    const checks = this.config?.checks || [];
    if (checks.length === 0) return true;

    this.logVerbose(`Running checks: ${checks.join(', ')}`);

    for (const cmd of checks) {
      try {
        logger.info(`Running check: ${cmd}`);
        await execa(cmd, { cwd: this.repoPath, shell: true });
      } catch (error) {
        logger.error(`Check failed: ${cmd}`);
        this.logVerbose(`Check output: ${error.message}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Reload configuration
   */
  async reloadConfig() {
    this.config = await loadConfig(this.repoPath);
    this.logVerbose('Config reloaded');
  }

  /**
   * Reload ignore patterns
   */
  async reloadIgnore() {
    const ignorePath = getIgnorePath(this.repoPath);
    this.ignorePatterns = []; 
    
    if (await fs.pathExists(ignorePath)) {
      try {
        const content = await fs.readFile(ignorePath, 'utf-8');
        const lines = content.split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.startsWith('#'));
        
        this.ignorePatterns.push(...lines);
        this.logVerbose(`Loaded ${lines.length} ignore patterns`);
      } catch (error) {
        logger.warn(`Failed to load ignore file: ${error.message}`);
      }
    }
    
    // Also load ignore patterns from config json if they exist
    if (this.config?.ignore && Array.isArray(this.config.ignore)) {
       this.ignorePatterns.push(...this.config.ignore);
    }
  }

  handleError(error) {
    logger.error(`Watcher error: ${error.message}`);
    this.logVerbose(`Watcher error: ${error.stack}`);
  }

  logVerbose(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    fs.appendFile(this.logFilePath, logLine).catch(() => {});
  }
}

module.exports = Watcher;
