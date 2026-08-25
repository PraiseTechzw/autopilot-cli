const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const STATE_FILE = '.autopilot-state.json';
const STATE_VERSION = 1;

class StateManager {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.stateFile = path.join(repoPath, STATE_FILE);
    this.init();
  }

  init() {
    if (!fs.existsSync(this.stateFile)) {
      this.reset();
    }
  }

  getState() {
    if (!fs.existsSync(this.stateFile)) {
      return this._getDefaultState();
    }
    try {
      const state = fs.readJsonSync(this.stateFile);
      // Basic migration/validation
      return { ...this._getDefaultState(), ...state };
    } catch (error) {
      logger.error('Failed to read state:', error.message);
      return this._getDefaultState();
    }
  }

  _getDefaultState() {
    return {
      version: STATE_VERSION,
      repoRoot: this.repoPath,
      repoName: path.basename(this.repoPath),
      running: false,
      paused: false,
      status: 'stopped',
      reason: null,
      branch: 'unknown',
      branchBlocked: false,
      health: 'unknown',
      lastCommitHash: null,
      lastCommitMessage: null,
      lastCommitAt: null,
      lastPushHash: null,
      lastPushStatus: null,
      lastPushAt: null,
      queueDepth: 0,
      conflicts: null,
      watcherPid: null,
      updatedAt: new Date().toISOString(),
      teamMode: false,
      aiMode: 'System'
    };
  }

  setState(newState) {
    try {
      const currentState = this.getState();
      const updatedState = { ...currentState, ...newState, updatedAt: new Date().toISOString() };
      
      // Compute derived fields for the public contract
      if (updatedState.status === 'running' || updatedState.status === 'watching') {
        updatedState.running = true;
      } else if (updatedState.status === 'stopped') {
        updatedState.running = false;
      }
      updatedState.paused = updatedState.status === 'paused';

      // Atomic write
      const tempFile = `${this.stateFile}.tmp.${Date.now()}`;
      fs.writeJsonSync(tempFile, updatedState, { spaces: 2 });
      fs.renameSync(tempFile, this.stateFile);
    } catch (error) {
      logger.error('Failed to write state:', error.message);
    }
  }

  reset() {
    this.setState({
      status: 'running', 
      running: true,
      paused: false,
      reason: null,
      pausedAt: null
    });
  }

  pause(reason) {
    this.setState({
      status: 'paused',
      running: false,
      paused: true,
      reason: reason || 'User paused',
      pausedAt: new Date().toISOString()
    });
  }

  resume() {
    this.reset();
  }

  isPaused() {
    const state = this.getState();
    return state.status === 'paused' || state.paused;
  }
}

module.exports = StateManager;
