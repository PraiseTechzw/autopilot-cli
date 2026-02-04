const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const { getAutopilotHome } = require('../utils/paths');

const STATE_FILE = 'state.json';

class StateManager {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.stateDir = path.join(repoPath, '.autopilot');
    this.stateFile = path.join(this.stateDir, STATE_FILE);
    this.init();
  }

  init() {
    fs.ensureDirSync(this.stateDir);
    if (!fs.existsSync(this.stateFile)) {
      this.reset();
    }
  }

  getState() {
    if (!fs.existsSync(this.stateFile)) {
      return { status: 'running' };
    }
    try {
      return fs.readJsonSync(this.stateFile);
    } catch (error) {
      logger.error('Failed to read state:', error.message);
      return { status: 'running' }; // Default
    }
  }

  setState(newState) {
    try {
      const currentState = this.getState();
      const updatedState = { ...currentState, ...newState };
      fs.writeJsonSync(this.stateFile, updatedState, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to write state:', error.message);
    }
  }

  reset() {
    this.setState({
      status: 'running', // running | paused
      reason: null,
      pausedAt: null
    });
  }

  pause(reason) {
    this.setState({
      status: 'paused',
      reason: reason || 'User paused',
      pausedAt: new Date().toISOString()
    });
  }

  resume() {
    this.reset();
  }

  isPaused() {
    const state = this.getState();
    return state.status === 'paused';
  }
}

module.exports = StateManager;
