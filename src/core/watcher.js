const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const { execa } = require('execa');
const logger = require('../utils/logger');
const git = require('./git');
const { DEFAULT_CONFIG } = require('../config/defaults');
const { generateCommitMessage } = require('./commit');
const { getConfigPath, getIgnorePath } = require('../utils/paths');
const { savePid, removePid, registerProcessHandlers } = require('../utils/process');

class Watcher {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.config = { ...DEFAULT_CONFIG };
    this.ignorePatterns = [];
    this.ignoreMatchers = [];
    this.watcher = null;
    this.isWatching = false;
    this.isProcessing = false;
    this.pending = false;
    this.debounceTimer = null;
    this.lastCommitAt = 0;
    this.logFilePath = path.join(repoPath, 'autopilot.log');
  }

  async start() {
    if (this.isWatching) {
      logger.warn('Watcher is already running');
      return;
    }

    await fs.ensureFile(this.logFilePath);
    await savePid(process.pid, this.repoPath);

    logger.section('Autopilot Watcher');
    logger.info('Built by Praise Masunga (PraiseTechzw)');

    await this.reloadConfig();
    await this.reloadIgnore();

    this.watcher = chokidar.watch(this.repoPath, {
      ignored: (filePath) => this.isIgnored(filePath),
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', (filePath) => this.onFsEvent(filePath));
    this.watcher.on('change', (filePath) => this.onFsEvent(filePath));
    this.watcher.on('unlink', (filePath) => this.onFsEvent(filePath));
    this.watcher.on('error', (error) => {
      logger.error(`Watcher error: ${error.message}`);
      this.logVerbose(`Watcher error: ${error.stack || error.message}`);
    });

    registerProcessHandlers(async () => {
      await this.stop();
    });

    this.isWatching = true;
    logger.success('Autopilot is watching for changes');
  }

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
    } catch (error) {
      this.logVerbose(`Stop error: ${error.stack || error.message}`);
    } finally {
      this.isWatching = false;
      await removePid(this.repoPath);
      logger.success('Autopilot watcher stopped');
    }
  }

  isRunning() {
    return this.isWatching;
  }

  onFsEvent(filePath) {
    this.logVerbose(`Change detected: ${filePath}`);
    this.scheduleDebounced();
  }

  scheduleDebounced() {
    const debounceMs = (this.config.debounceSeconds || DEFAULT_CONFIG.debounceSeconds) * 1000;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.runCycle(), debounceMs);
  }

  async runCycle() {
    if (this.isProcessing) {
      this.pending = true;
      return;
    }

    const minMs =
      (this.config.minSecondsBetweenCommits || DEFAULT_CONFIG.minSecondsBetweenCommits) * 1000;
    if (this.lastCommitAt && Date.now() - this.lastCommitAt < minMs) {
      const waitMs = minMs - (Date.now() - this.lastCommitAt);
      this.logVerbose(`Anti-spam active. Waiting ${waitMs}ms before next commit.`);
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => this.runCycle(), waitMs);
      return;
    }

    this.isProcessing = true;
    this.pending = false;

    try {
      await this.reloadConfig();
      await this.reloadIgnore();
      await this.processChanges();
    } catch (error) {
      logger.error('Autopilot cycle failed');
      this.logVerbose(`Cycle error: ${error.stack || error.message}`);
    } finally {
      this.isProcessing = false;
      if (this.pending) {
        this.pending = false;
        this.scheduleDebounced();
      }
    }
  }

  async processChanges() {
    const hasChanges = await git.hasChanges(this.repoPath);
    if (!hasChanges) {
      this.logVerbose('No changes detected in working tree.');
      return;
    }

    const branch = await git.getBranch(this.repoPath);
    if (!branch) {
      logger.warn('Unable to determine current branch');
      this.logVerbose('Branch detection failed');
      return;
    }

    if ((this.config.blockBranches || []).includes(branch)) {
      logger.warn(`Blocked branch "${branch}". Switch branches to enable autopilot.`);
      this.logVerbose(`Blocked branch: ${branch}`);
      return;
    }

    const fetchResult = await git.fetch(this.repoPath);
    if (!fetchResult.ok) {
      logger.warn('Fetch failed. Skipping commit cycle.');
      this.logVerbose(`Fetch failed: ${fetchResult.stderr}`);
      return;
    }

    const remoteAhead = await git.isRemoteAhead(this.repoPath);
    if (remoteAhead) {
      logger.warn('Remote is ahead. Please pull before autopilot can continue.');
      this.logVerbose('Remote ahead detected.');
      return;
    }

    if (this.config.requireChecks && Array.isArray(this.config.checks) && this.config.checks.length) {
      const checksOk = await this.runChecks(this.config.checks);
      if (!checksOk) {
        return;
      }
    }

    const files = await git.getPorcelainStatus(this.repoPath);
    if (!files.length) {
      this.logVerbose('No staged changes found in git status.');
      return;
    }

    const message =
      this.config.commitMessageMode === 'simple'
        ? 'chore: update changes'
        : generateCommitMessage(files);

    const addResult = await git.addAll(this.repoPath);
    if (!addResult.ok) {
      logger.warn('Failed to stage changes');
      this.logVerbose(`git add failed: ${addResult.stderr}`);
      return;
    }

    const commitResult = await git.commit(this.repoPath, message);
    if (!commitResult.ok) {
      logger.warn('Commit skipped or failed');
      this.logVerbose(`git commit failed: ${commitResult.stderr}`);
      return;
    }

    if (this.config.autoPush) {
      const pushResult = await git.push(this.repoPath, branch);
      if (!pushResult.ok) {
        logger.warn('Push failed');
        this.logVerbose(`git push failed: ${pushResult.stderr}`);
      } else {
        logger.success(`Committed and pushed (${branch}): ${message}`);
      }
    } else {
      logger.success(`Committed (${branch}): ${message}`);
    }

    this.lastCommitAt = Date.now();
  }

  async runChecks(checks) {
    for (const cmd of checks) {
      if (!cmd || typeof cmd !== 'string') {
        continue;
      }
      this.logVerbose(`Running check: ${cmd}`);
      const result = await execa(cmd, { cwd: this.repoPath, shell: true, reject: false });
      if (result.exitCode !== 0) {
        logger.warn(`Check failed: ${cmd}`);
        this.logVerbose(`Check failed: ${cmd}\n${result.stdout}\n${result.stderr}`);
        return false;
      }
    }
    return true;
  }

  async reloadConfig() {
    const configPath = getConfigPath(this.repoPath);
    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        this.config = { ...DEFAULT_CONFIG, ...config };
        return;
      }
    } catch (error) {
      logger.warn(`Error reading config: ${error.message}`);
      this.logVerbose(`Config read error: ${error.stack || error.message}`);
    }
    this.config = { ...DEFAULT_CONFIG };
  }

  async reloadIgnore() {
    const ignorePath = getIgnorePath(this.repoPath);
    let patterns = [];
    try {
      if (await fs.pathExists(ignorePath)) {
        const content = await fs.readFile(ignorePath, 'utf-8');
        patterns = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#'));
      }
    } catch (error) {
      this.logVerbose(`Ignore read error: ${error.stack || error.message}`);
    }

    const builtIn = ['.autopilot.pid', 'autopilot.log'];
    this.ignorePatterns = [...patterns, ...builtIn];
    this.ignoreMatchers = this.buildIgnoreMatchers(this.ignorePatterns);
  }

  buildIgnoreMatchers(patterns) {
    return patterns
      .map((pattern) => pattern.trim())
      .filter(Boolean)
      .map((pattern) => {
        const normalized = pattern.replace(/\\/g, '/').replace(/^\/+/, '');
        if (normalized.endsWith('/')) {
          return { type: 'prefix', value: normalized };
        }
        if (normalized.startsWith('*.')) {
          return { type: 'ext', value: normalized.slice(1) };
        }
        if (normalized.includes('*')) {
          const escaped = normalized.replace(/[.+^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
          return { type: 'regex', value: regex };
        }
        return { type: 'exact', value: normalized };
      });
  }

  isIgnored(filePath) {
    const relativePath = path.relative(this.repoPath, filePath).replace(/\\/g, '/');
    if (!relativePath || relativePath === '') {
      return false;
    }

    if (relativePath === '.git' || relativePath.startsWith('.git/')) {
      return true;
    }

    for (const matcher of this.ignoreMatchers) {
      if (matcher.type === 'prefix' && relativePath.startsWith(matcher.value)) {
        return true;
      }
      if (matcher.type === 'ext' && relativePath.endsWith(matcher.value)) {
        return true;
      }
      if (matcher.type === 'regex' && matcher.value.test(relativePath)) {
        return true;
      }
      if (matcher.type === 'exact' && relativePath === matcher.value) {
        return true;
      }
    }

    return false;
  }

  logVerbose(message) {
    const timestamp = new Date().toISOString();
    fs.appendFile(this.logFilePath, `[${timestamp}] ${message}\n`).catch(() => {
      // Ignore logging failures
    });
  }
}

module.exports = Watcher;
