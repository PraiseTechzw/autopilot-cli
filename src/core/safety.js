const fs = require('fs-extra');
const path = require('path');
const execa = require('execa');
const logger = require('../utils/logger');
const git = require('./git');

// Regex patterns for common secrets
const SECRET_PATTERNS = [
  { name: 'AWS Access Key', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
  { name: 'AWS Secret Key', regex: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/ },
  { name: 'GitHub Token', regex: /(gh[pousr]_[a-zA-Z0-9]{36,255})/ },
  { name: 'Stripe Secret Key', regex: /(sk_live_[0-9a-zA-Z]{24})/ },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\\-_]{35}/ },
  { name: 'Bearer Token', regex: /Bearer [a-zA-Z0-9\-\._~\+\/]+=*/ },
  { name: 'Generic Private Key', regex: /-----BEGIN PRIVATE KEY-----/ }
];

const MAX_FILE_SIZE_MB = 50;

/**
 * Validate configuration
 */
const validateConfig = (config) => {
  const errors = [];

  if (!config) {
    errors.push('Configuration is missing');
    return errors;
  }

  if (config.commitMessage && typeof config.commitMessage !== 'string') {
    errors.push('commitMessage must be a string');
  }

  if (config.autoPush && typeof config.autoPush !== 'boolean') {
    errors.push('autoPush must be a boolean');
  }

  if (config.ignore && !Array.isArray(config.ignore)) {
    errors.push('ignore must be an array');
  }

  return errors;
};

/**
 * Run pre-commit checks on staged files
 * @param {string} repoPath
 * @param {object} config
 * @returns {Promise<{ok: boolean, errors: string[]}>}
 */
const validateBeforeCommit = async (repoPath, config) => {
  const errors = [];
  
  if (!config.preCommitChecks) {
    return { ok: true, errors: [] };
  }

  // 0. Merge/Rebase Safety Check (Hard Guarantee)
  const isMerge = await git.isMergeInProgress(repoPath);
  if (isMerge) {
    return { ok: false, errors: ['Repository is in a merge/rebase state. Autopilot paused for safety.'] };
  }

  try {
    // Get staged files
    const statusObj = await git.getPorcelainStatus(repoPath);
    // Filter only modified/added files (ignore deleted)
    const stagedFiles = statusObj.files.filter(f => f.status !== 'D' && f.status !== ' D');
    
    // 1. File Size Check
    if (config.preCommitChecks.fileSize) {
      for (const file of stagedFiles) {
        try {
          const filePath = path.join(repoPath, file.file);
          if (fs.existsSync(filePath)) {
            const stats = await fs.stat(filePath);
            const sizeMb = stats.size / (1024 * 1024);
            if (sizeMb > MAX_FILE_SIZE_MB) {
              errors.push(`File ${file.file} is too large (${sizeMb.toFixed(2)}MB > ${MAX_FILE_SIZE_MB}MB)`);
            }
          }
        } catch (err) {
          // Ignore missing files
        }
      }
    }

    // 2. Secret Detection
    if (config.preCommitChecks.secrets) {
      for (const file of stagedFiles) {
        try {
          const filePath = path.join(repoPath, file.file);
          if (fs.existsSync(filePath)) {
            // Read first 1MB only for performance
            // Use stream or buffer
            const buffer = Buffer.alloc(1024 * 1024);
            const fd = await fs.open(filePath, 'r');
            const { bytesRead } = await fs.read(fd, buffer, 0, buffer.length, 0);
            await fs.close(fd);
            
            const content = buffer.toString('utf8', 0, bytesRead);
            
            for (const pattern of SECRET_PATTERNS) {
              if (pattern.regex.test(content)) {
                errors.push(`Possible ${pattern.name} detected in ${file.file}`);
              }
            }
          }
        } catch (err) {
           logger.debug(`Could not read ${file.file} for secret scan: ${err.message}`);
        }
      }
    }

    // 3. Linting
    if (config.preCommitChecks.lint && config.preCommitChecks.lint !== false) {
      logger.info('Running lint check...');
      try {
        await execa.command('npm run lint', { cwd: repoPath });
      } catch (err) {
        errors.push(`Lint check failed: ${err.shortMessage || err.message}`);
      }
    }

    // 4. Tests
    if (config.preCommitChecks.test) {
      logger.info('Running tests...');
      try {
        await execa.command(config.preCommitChecks.test, { cwd: repoPath });
      } catch (err) {
        errors.push(`Test check failed: ${err.shortMessage || err.message}`);
      }
    }

  } catch (error) {
    logger.error(`Validation error: ${error.message}`);
    // If validation crashes, safe to fail open? No, fail closed for safety.
    errors.push(`Validation crashed: ${error.message}`);
  }

  return { ok: errors.length === 0, errors };
};

/**
 * Handle Team Mode Checks (Pull-Before-Push)
 * @param {string} repoPath 
 * @param {object} config 
 * @returns {Promise<{ok: boolean, action: 'continue'|'pull'|'abort'}>}
 */
const checkTeamStatus = async (repoPath, config) => {
  if (!config.teamMode) {
    return { ok: true, action: 'continue' };
  }

  logger.debug('Running Team Mode checks...');

  // Check unpushed commits limit
  try {
    const branch = await git.getBranch(repoPath);
    if (!branch) return { ok: false, action: 'abort' }; // No branch?

    const { stdout: unpushedCount } = await execa('git', ['rev-list', '--count', `origin/${branch}..HEAD`], { cwd: repoPath }).catch(() => ({ stdout: '0' }));
    
    if (Number(unpushedCount) > (config.maxUnpushedCommits || 5)) {
      logger.warn(`Too many unpushed commits (${unpushedCount}). Pushing required.`);
      // We might force a push here or just warn
    }

    // Fetch to see if we are behind
    await git.fetch(repoPath);
    const remoteStatus = await git.isRemoteAhead(repoPath);
    
    if (remoteStatus.behind) {
      if (config.pullBeforePush) {
        logger.info('Remote is ahead. Pulling changes...');
        // Try pull --rebase
        try {
          await execa('git', ['pull', '--rebase'], { cwd: repoPath });
          return { ok: true, action: 'continue' };
        } catch (err) {
          logger.error('Pull failed (conflict detected).');
          return { ok: false, action: 'abort' };
        }
      } else {
        return { ok: false, action: 'abort' };
      }
    }

    // Detect potential conflicts without pulling (git diff --check)
    // Actually git diff --check is for whitespace, not merge conflicts.
    // To check for merge conflicts before pulling is hard without actually merging.
    // But since we did fetch, we can dry-run a merge?
    // For now, relies on pull --rebase failure above.

  } catch (err) {
    logger.warn(`Team check failed: ${err.message}`);
    // If we can't check, maybe safe to continue locally? 
    // But "conflictStrategy": "abort" suggests we should stop.
    if (config.conflictStrategy === 'abort') return { ok: false, action: 'abort' };
  }

  return { ok: true, action: 'continue' };
};

module.exports = {
  validateConfig,
  validateBeforeCommit,
  checkTeamStatus
};
