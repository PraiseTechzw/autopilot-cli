const fs = require('fs-extra');
const path = require('path');
const { getAutopilotHome } = require('../utils/paths');
const logger = require('../utils/logger');

const HISTORY_FILE = 'history.json';

class HistoryManager {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.historyDir = path.join(repoPath, '.autopilot');
    this.historyFile = path.join(this.historyDir, HISTORY_FILE);
    this.init();
  }

  init() {
    fs.ensureDirSync(this.historyDir);
    if (!fs.existsSync(this.historyFile)) {
      fs.writeJsonSync(this.historyFile, { commits: [] }, { spaces: 2 });
    }
  }

  getHistory() {
    try {
      const data = fs.readJsonSync(this.historyFile);
      return data.commits || [];
    } catch (error) {
      logger.error('Failed to read history:', error.message);
      return [];
    }
  }

  addCommit(commitData) {
    try {
      const history = this.getHistory();
      history.unshift({
        ...commitData,
        timestamp: new Date().toISOString()
      });
      // Keep only last 100 commits
      if (history.length > 100) history.length = 100;
      
      fs.writeJsonSync(this.historyFile, { commits: history }, { spaces: 2 });
    } catch (error) {
      logger.error('Failed to write history:', error.message);
    }
  }

  getLastCommit() {
    const history = this.getHistory();
    return history[0];
  }

  removeLastCommit() {
    try {
      const history = this.getHistory();
      if (history.length === 0) return null;
      
      const removed = history.shift();
      fs.writeJsonSync(this.historyFile, { commits: history }, { spaces: 2 });
      return removed;
    } catch (error) {
      logger.error('Failed to update history:', error.message);
      return null;
    }
  }
}

module.exports = HistoryManager;
