/**
 * Git helper module - Clean, testable Git operations
 * Built by Praise Masunga (PraiseTechzw)
 */

const { execa } = require('execa');

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
      .map(line => line.slice(3).trim()); // Remove status prefix (XY + space)

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
 * @param {string} branch - Branch to push
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>} Result object
 */
async function push(root, branch) {
  try {
    const { stdout, stderr } = await execa('git', ['push', 'origin', branch], { cwd: root });
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: '', stderr: error.message };
  }
}

module.exports = {
  getBranch,
  hasChanges,
  getPorcelainStatus,
  addAll,
  commit,
  fetch,
  isRemoteAhead,
  push,
};
