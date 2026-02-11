const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');
const git = require('../core/git');
const { createObjectCsvWriter } = require('csv-writer');

async function getGitStats(repoPath) {
  try {
    const { stdout } = await git.runGit(repoPath, [
      'log',
      '--pretty=format:===C===%H|%an|%ad|%s|%b===E===',
      '--date=iso',
      '--numstat'
    ]);

    if (!stdout) return [];

    const commits = [];
    const rawCommits = stdout.split('===C===').filter(Boolean);

    for (const raw of rawCommits) {
      const [metadataPlusBody, ...statsParts] = raw.split('===E===');
      if (!metadataPlusBody) continue;

      const [hash, author, dateStr, subject, ...bodyParts] = metadataPlusBody.trim().split('|');
      const body = bodyParts.join('|'); // Rejoin in case body had pipes

      // Trust Verification: Only process autopilot commits
      if (!body.includes('Autopilot-Commit: true')) continue;

      const commit = {
        hash,
        author,
        date: new Date(dateStr),
        message: `${subject}\n${body}`.trim(),
        files: [],
        additions: 0,
        deletions: 0
      };

      const statsText = statsParts.join('===E===').trim();
      if (statsText) {
        const statLines = statsText.split('\n');
        for (const line of statLines) {
          const [add, del, file] = line.trim().split(/\s+/);
          if (file) {
            const additions = parseInt(add) || 0;
            const deletions = parseInt(del) || 0;
            commit.files.push({ file, additions, deletions });
            commit.additions += additions;
            commit.deletions += deletions;
          }
        }
      }
      commits.push(commit);
    }

    return commits;
  } catch (error) {
    logger.error(`Failed to analyze git history: ${error.message}`);
    return [];
  }
}

function calculateMetrics(commits) {
  const stats = {
    totalCommits: commits.length,
    totalFilesChanged: new Set(),
    totalAdditions: 0,
    totalDeletions: 0,
    commitsByDay: {},
    commitsByHour: {},
    authors: {},
    streak: { current: 0, max: 0 },
    topFiles: {},
    quality: {
      conventional: 0,
      issuesReferenced: 0,
      avgLength: 0,
      score: 0
    }
  };

  const dates = new Set();
  let totalMessageLength = 0;

  commits.forEach(c => {
    // Aggregates
    stats.totalAdditions += c.additions;
    stats.totalDeletions += c.deletions;
    c.files.forEach(f => {
      stats.totalFilesChanged.add(f.file);
      stats.topFiles[f.file] = (stats.topFiles[f.file] || 0) + 1;
    });

    // Time analysis
    const dateStr = c.date.toISOString().split('T')[0];
    const hour = c.date.getHours();

    stats.commitsByDay[dateStr] = (stats.commitsByDay[dateStr] || 0) + 1;
    stats.commitsByHour[hour] = (stats.commitsByHour[hour] || 0) + 1;
    dates.add(dateStr);

    // Quality
    const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+/;
    if (conventionalRegex.test(c.message)) stats.quality.conventional++;
    if (/#\d+/.test(c.message)) stats.quality.issuesReferenced++;
    totalMessageLength += c.message.length;
  });

  // Calculate Averages
  stats.totalFilesCount = stats.totalFilesChanged.size;
  stats.quality.avgLength = commits.length ? Math.round(totalMessageLength / commits.length) : 0;

  // Calculate Score (0-100)
  // 40% Conventional, 30% Message Length (>30 chars), 30% Consistency
  const convScore = commits.length ? (stats.quality.conventional / commits.length) * 40 : 0;
  const lenScore = Math.min(stats.quality.avgLength / 50, 1) * 30; // Cap at 50 chars
  const consistencyScore = 30; // Placeholder for now
  stats.quality.score = Math.round(convScore + lenScore + consistencyScore);

  // Streak Calculation
  const sortedDates = Array.from(dates).sort();
  let currentStreak = 0;
  let maxStreak = 0;
  let lastDate = null;

  sortedDates.forEach(date => {
    const d = new Date(date);
    if (!lastDate) {
      currentStreak = 1;
    } else {
      const diffTime = Math.abs(d - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    lastDate = d;
  });
  stats.streak.max = Math.max(maxStreak, currentStreak);

  // Check if streak is active (last commit today or yesterday)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastCommitDate = sortedDates[sortedDates.length - 1];

  if (lastCommitDate === today || lastCommitDate === yesterday) {
    stats.streak.current = currentStreak;
  } else {
    stats.streak.current = 0;
  }

  return stats;
}

async function insights(options) {
  try {
    const repoPath = options.cwd || process.cwd();
    logger.info('Analyzing repository history...');

    const commits = await getGitStats(repoPath);
    if (commits.length === 0) {
      logger.warn('No git history found.');
      return;
    }

    const metrics = calculateMetrics(commits);

    if (options.format === 'json') {
      console.log(JSON.stringify(metrics, null, 2));
      return;
    }

    // Display Report
    console.log('');
    logger.section('📈 Project Analytics');
    console.log(`Total Commits:    ${metrics.totalCommits}`);
    console.log(`Files Changed:    ${metrics.totalFilesCount}`);
    console.log(`Lines Added:      ${metrics.totalAdditions}`);
    console.log(`Lines Deleted:    ${metrics.totalDeletions}`);
    console.log(`Current Streak:   ${metrics.streak.current} days (Max: ${metrics.streak.max})`);

    // Find most productive hour
    const productiveHour = Object.entries(metrics.commitsByHour)
      .sort(([, a], [, b]) => b - a)[0];
    console.log(`Peak Productivity: ${productiveHour ? productiveHour[0] + ':00' : 'N/A'}`);

    console.log('');
    logger.section('💎 Quality Score: ' + metrics.quality.score + '/100');
    console.log(`Conventional Commits: ${Math.round((metrics.quality.conventional / metrics.totalCommits) * 100)}%`);
    console.log(`Avg Message Length:   ${metrics.quality.avgLength} chars`);
    console.log(`Issues Referenced:    ${metrics.quality.issuesReferenced}`);

    if (metrics.quality.score < 50) {
      logger.warn('Suggestion: Use conventional commits (feat:, fix:) to improve score.');
    } else if (metrics.quality.score > 80) {
      logger.success('Great job! High quality commit history.');
    }

    // CSV Export
    if (options.export === 'csv') {
      const csvPath = path.join(repoPath, 'autopilot-insights.csv');
      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: [
          { id: 'hash', title: 'Hash' },
          { id: 'date', title: 'Date' },
          { id: 'author', title: 'Author' },
          { id: 'message', title: 'Message' },
          { id: 'additions', title: 'Additions' },
          { id: 'deletions', title: 'Deletions' }
        ]
      });

      const records = commits.map(c => ({
        hash: c.hash,
        date: c.date.toISOString(),
        author: c.author,
        message: c.message,
        additions: c.additions,
        deletions: c.deletions
      }));

      await csvWriter.writeRecords(records);
      logger.success(`Exported insights to ${csvPath}`);
    }

  } catch (error) {
    logger.error(`Failed to generate insights: ${error.message}`);
  }
}

module.exports = { insights, getGitStats, calculateMetrics };
