const { getGitStats, calculateMetrics } = require('./insights');
const logger = require('../utils/logger');
const open = require('open');
const crypto = require('crypto');

// Default API URL (can be overridden by config)
const DEFAULT_API_URL = 'http://localhost:3000';

async function leaderboard(options) {
  const apiUrl = process.env.AUTOPILOT_API_URL || DEFAULT_API_URL;

  if (options.sync) {
    await syncLeaderboard(apiUrl, options);
  } else {
    logger.info(`Opening leaderboard at ${apiUrl}/leaderboard...`);
    await open(`${apiUrl}/leaderboard`);
  }
}

async function syncLeaderboard(apiUrl, options) {
  try {
    const repoPath = options.cwd || process.cwd();
    logger.info('Calculating stats for leaderboard sync...');

    const commits = await getGitStats(repoPath);
    if (commits.length === 0) {
      logger.warn('No git history found. Cannot sync stats.');
      return;
    }

    const metrics = calculateMetrics(commits);
    
    // Get user info (git config)
    const git = require('../core/git');
    const { stdout: username } = await git.runGit(repoPath, ['config', 'user.name']);
    const { stdout: email } = await git.runGit(repoPath, ['config', 'user.email']);
    
    const userEmail = email.trim() || 'unknown';
    const userName = username.trim() || 'Anonymous';
    
    // Anonymize ID using hash
    const userId = crypto.createHash('sha256').update(userEmail).digest('hex').substring(0, 12);

    const stats = {
      id: userId,
      username: userName, // Display name (can be public)
      score: metrics.quality.score * 100 + metrics.totalCommits * 10, // Example scoring
      commits: metrics.totalCommits,
      focusMinutes: Math.round(metrics.totalAdditions / 10), // Rough proxy if focus engine not linked
      streak: metrics.streak.current
    };

    // If Focus Engine logs exist, use them for more accurate focus time
    // TODO: Read autopilot.log for accurate focus time

    logger.info(`Syncing stats for ${stats.username} (ID: ${userId})...`);
    logger.info('Note: Only metrics are shared. No code or file contents are transmitted.');
    
    const response = await fetch(`${apiUrl}/api/leaderboard/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    logger.success(`Successfully synced! You are currently ranked #${data.rank}.`);

  } catch (error) {
    logger.error(`Failed to sync leaderboard: ${error.message}`);
    logger.info('Make sure the docs server is running (npm run dev in autopilot-docs)');
  }
}

module.exports = { leaderboard };
