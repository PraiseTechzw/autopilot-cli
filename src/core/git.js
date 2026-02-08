/**
 * Git helper module - Clean, testable Git operations
 * Built by Praise Masunga (PraiseTechzw)
 */

const execa = require('execa');

/**
 * Get current branch name
 * @param {string} root - Repository root path
 * @returns {Promise<string|null>} Branch name or null on error
 */
async function getBranch(root) {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

/**
 * Check if repository has uncommitted changes
 * @param {string} root - Repository root path
 * @returns {Promise<boolean>} True if there are changes
 */
async function hasChanges(root) {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: root });
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get porcelain status - parsed list of changed files
 * @param {string} root - Repository root path
 * @returns {Promise<{ok: boolean, files: string[], raw: string}>} Status object
 */
async function getPorcelainStatus(root) {
  try {
    const { stdout } = await execa('git', ['status', '--porcelain'], { cwd: root });
    const raw = stdout.trim();
    
    if (!raw) {
      return { ok: true, files: [], raw: '' };
    }

    const files = raw
      .split(/\r?\n/)
      .map(line => {
        const status = line.slice(0, 2).trim();
        const file = line.slice(3).trim();
        return { status, file };
      });

    return { ok: true, files, raw };
  } catch (error) {
    return { ok: false, files: [], raw: error.message };
  }
}

/**
 * Stage all changes (git add -A)
 * @param {string} root - Repository root path
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function addAll(root) {
  try {
    const { stdout, stderr } = await execa('git', ['add', '-A'], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Commit staged changes
 * @param {string} root - Repository root path
 * @param {string} message - Commit message
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function commit(root, message) {
  try {
    const { stdout, stderr } = await execa('git', ['commit', '-m', message], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Fetch updates from remote
 * @param {string} root - Repository root path
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function fetch(root) {
  try {
    const { stdout, stderr } = await execa('git', ['fetch'], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Run a generic git command
 * @param {string} root - Repository root path
 * @param {string[]} args - Git arguments
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function runGit(root, args) {
  try {
    const { stdout, stderr } = await execa('git', args, { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Check if remote is ahead/behind
 * @param {string} root - Repository root path
 * @returns {Promise<{ok: boolean, ahead: boolean, behind: boolean, raw: string}>} Status object
 */
async function isRemoteAhead(root) {
  try {
    const branch = await getBranch(root);
    if (!branch) return { ok: false, ahead: false, behind: false, raw: 'No branch' };

    // Ensure we have latest info
    await fetch(root);

    const { stdout } = await execa('git', ['rev-list', '--left-right', '--count', `${branch}...origin/${branch}`], { cwd: root });
    const [aheadCount, behindCount] = stdout.trim().split(/\s+/).map(Number);
    
    return {
      ok: true,
      ahead: aheadCount > 0,
      behind: behindCount > 0,
      raw: stdout.trim()
    };
  } catch (error) {
    return { ok: false, ahead: false, behind: false, raw: error.message };
  }
}

/**
 * Push changes to remote
 * @param {string} root - Repository root path
 * @param {string} [branch] - Branch to push (optional, defaults to current)
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function push(root, branch) {
  try {
    const targetBranch = branch || await getBranch(root);
    if (!targetBranch) throw new Error('Could not determine branch to push');

    const { stdout, stderr } = await execa('git', ['push', 'origin', targetBranch], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Get diff of changes
 * @param {string} root - Repository root path
 * @param {boolean} staged - Whether to get staged diff (default: true)
 * @returns {Promise<string>} Diff content
 */
async function getDiff(root, staged = true) {
  try {
    const args = ['diff'];
    if (staged) args.push('--cached');
    args.push('-U3');
    const { stdout } = await execa('git', args, { cwd: root });
    return stdout || '';
  } catch (error) {
    return '';
  }
}

/**
 * Revert a specific commit
 * @param {string} root - Repository root path
 * @param {string} hash - Commit hash
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function revert(root, hash) {
  try {
    const { stdout, stderr } = await execa('git', ['revert', '--no-edit', hash], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Reset to a specific commit (soft reset)
 * @param {string} root - Repository root path
 * @param {string} target - Target commitish (e.g. HEAD~1)
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function resetSoft(root, target) {
  try {
    const { stdout, stderr } = await execa('git', ['reset', '--soft', target], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

/**
 * Check if a commit exists
 * @param {string} root - Repository root path
 * @param {string} hash - Commit hash
 * @returns {Promise<boolean>} True if exists
 */
async function commitExists(root, hash) {
  try {
    await execa('git', ['cat-file', '-e', `${hash}^{commit}`], { cwd: root });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the latest commit hash
 * @param {string} root - Repository root path
 * @returns {Promise<string|null>} Commit hash or null
 */
async function getLatestCommitHash(root) {
  try {
    const { stdout } = await execa('git', ['rev-parse', 'HEAD'], { cwd: root });
    return stdout.trim();
  } catch (error) {
    return null;
  }
}

const fs = require('fs-extra');
const path = require('path');

/**
 * Check if repository is in a merge/rebase/cherry-pick state
 * @param {string} root - Repository root path
 * @returns {Promise<boolean>} True if operation in progress
 */
async function isMergeInProgress(root) {
  try {
    const gitDir = path.join(root, '.git');
    const files = [
      'MERGE_HEAD',
      'REBASE_HEAD',
      'CHERRY_PICK_HEAD',
      'REVERT_HEAD',
      'BISECT_LOG'
    ];
    
    // Check if .git/rebase-merge or .git/rebase-apply exists (directory check)
    if (await fs.pathExists(path.join(gitDir, 'rebase-merge')) || 
        await fs.pathExists(path.join(gitDir, 'rebase-apply'))) {
      return true;
    }

    for (const file of files) {
      if (await fs.pathExists(path.join(gitDir, file))) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getBranch,
  hasChanges,
  getPorcelainStatus,
  addAll,
  commit,
  fetch,
  runGit,
  isRemoteAhead,
  push,
  getDiff,
  revert,
  resetSoft,
  commitExists,
  getLatestCommitHash,
  isMergeInProgress
};
