/**
 * Autopilot Focus Engine
 * Tracks active/idle time and generates insights
 */

const path = require('path');
const logger = require('../utils/logger');

class FocusEngine {
  constructor(repoPath, config) {
    this.repoPath = repoPath;
    this.config = config?.focus || {
      activeThresholdSeconds: 120, // 2 mins between events counts as continuous active time
      sessionTimeoutSeconds: 1800, // 30 mins gap = new session
      trackingEnabled: true
    };
    
    this.stats = {
      files: {}, // filePath -> { activeMs: 0, idleMs: 0, lastEvent: 0 }
      totalActiveMs: 0,
      totalIdleMs: 0,
      currentSessionStart: Date.now(),
      lastGlobalEvent: Date.now()
    };
    
    this.activeFile = null;
    this.microGoals = [];
    this.lastLogTime = 0;
    this.msSinceLastCommit = 0;
    this.nudgeThresholdMs = 500000; // 500,000 ms as requested
  }

  onCommit() {
    this.msSinceLastCommit = 0;
    this.appendLog('FOCUS_COMMIT', { msSinceLastCommit: this.msSinceLastCommit });
  }

  updateConfig(newConfig) {
    if (newConfig && newConfig.focus) {
      this.config = { ...this.config, ...newConfig.focus };
    }
  }

  /**
   * Handle file system event for focus tracking
   * @param {string} filePath - Relative path of the file
   */
  onFileEvent(filePath) {
    if (!this.config.trackingEnabled) return;

    const now = Date.now();
    
    // Initialize file stats if new
    if (!this.stats.files[filePath]) {
      this.stats.files[filePath] = {
        activeMs: 0,
        idleMs: 0,
        lastEvent: now,
        sessionCount: 1
      };
    }

    const fileStat = this.stats.files[filePath];
    const delta = now - fileStat.lastEvent;
    const globalDelta = now - this.stats.lastGlobalEvent;

    // Determine if this is a continuation or new session
    const activeThresholdMs = this.config.activeThresholdSeconds * 1000;
    const sessionTimeoutMs = this.config.sessionTimeoutSeconds * 1000;

    if (delta < activeThresholdMs) {
      // Continuous activity
      fileStat.activeMs += delta;
      this.stats.totalActiveMs += globalDelta; // Add to global active time

      this.msSinceLastCommit += delta;

      // Nudge Check
      if (!this.nextNudgeMs) this.nextNudgeMs = this.nudgeThresholdMs;
      if (this.msSinceLastCommit > this.nextNudgeMs) {
        logger.warn(`[Nudge] You have been working for ${Math.round(this.msSinceLastCommit / 60000)} mins without a commit! Consider breaking this task down.`);
        this.appendLog('FOCUS_NUDGE', { reason: 'long_pending_time', ms: this.msSinceLastCommit });
        this.nextNudgeMs += 300000; // Remind again in 5 mins
      }
      
      // Heartbeat log every 5 minutes
      if (now - this.lastLogTime > 300000) {
        this.appendLog('FOCUS_HEARTBEAT', { 
          file: filePath, 
          activeMs: fileStat.activeMs,
          totalActiveMs: this.stats.totalActiveMs 
        });
        this.lastLogTime = now;
      }

    } else if (delta < sessionTimeoutMs) {
      // Idle period within session
      fileStat.idleMs += delta;
      this.stats.totalIdleMs += globalDelta;
    } else {
      // New session (gap too long)
      fileStat.sessionCount++;
      // We don't count the huge gap as idle time, it's just "away" time
      logger.debug(`[Focus] New session started for ${filePath}`);
      this.appendLog('FOCUS_SESSION_START', { file: filePath });
      this.lastLogTime = now;
    }

    // Context switch
    if (this.activeFile && this.activeFile !== filePath) {
        this.appendLog('FOCUS_SWITCH', { 
            from: this.activeFile, 
            to: filePath,
            prevFileActiveMs: this.stats.files[this.activeFile].activeMs
        });
    }

    fileStat.lastEvent = now;
    this.stats.lastGlobalEvent = now;
    this.activeFile = filePath;

    // Generate micro-goals
    this.generateMicroGoals(filePath);
  }

  /**
   * Generate simple micro-goals based on file type and context
   */
  generateMicroGoals(filePath) {
    const ext = path.extname(filePath);
    const goals = [];

    if (ext === '.js' || ext === '.ts' || ext === '.py') {
      goals.push({ type: 'test', message: `Run tests for ${path.basename(filePath)}` });
      goals.push({ type: 'refactor', message: 'Check for cognitive complexity' });
    } else if (ext === '.md') {
      goals.push({ type: 'review', message: 'Proofread content' });
    } else if (ext === '.json') {
      goals.push({ type: 'validate', message: 'Validate JSON structure' });
    }

    // Update goals (simple replacement for now, could be smarter)
    this.microGoals = goals;
    
    // Log the top goal if it changed
    if (goals.length > 0) {
      logger.debug(`[Focus] Goal: ${goals[0].message}`);
    }
  }

  /**
   * Get current focus stats
   */
  getStats() {
    return {
      activeFile: this.activeFile,
      totalActiveMinutes: Math.round(this.stats.totalActiveMs / 60000),
      totalIdleMinutes: Math.round(this.stats.totalIdleMs / 60000),
      currentMicroGoals: this.microGoals,
      fileBreakdown: this.stats.files
    };
  }

  async stop() {
    await this.integrationManager.notifyFocusEnd();
  }
}

module.exports = FocusEngine;
