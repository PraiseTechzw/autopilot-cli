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
    const result = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root });
    return result.stdout.trim();
  } catch (error) {
    // Not a git repo or other error
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
    const result = await execa('git', ['status', '--porcelain'], { cwd: root });
    return result.stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get porcelain status - parsed list of changed files
 * @param {string} root - Repository root path
 * @returns {Promise<string[]>} Array of changed file paths
 */
async function getPorcelainStatus(root) {
  try {
    const result = await execa('git', ['status', '--porcelain'], { cwd: root });
    
    // Parse porcelain output: "XY filename"
    // Example: " M file.js", "?? newfile.js"
    return result.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => line.slice(3).trim()); // Remove status prefix (XY + space)
  } catch (error) {
    return [];
  }
}

/**
 * Stage all changes (git add -A)
 * @param {string} root - Repository root path
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>}
 */
async function addAll(root) {
  try {
    const result = await execa('git', ['add', '-A'], { cwd: root });
    return {
      ok: true,
      stdout: result.stdout,
      stderr: result.stderr || '',
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}

/**
 * Commit staged changes
 * @param {string} root - Repository root path
 * @param {string} message - Commit message
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>}
 */
async function commit(root, message) {
  try {
    const result = await execa('git', ['commit', '-m', message], { cwd: root, reject: false });
    
    // Git commit returns exit code 0 on success
    return {
      ok: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr || '',
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}

/**
 * Fetch from remote (git fetch)
 * @param {string} root - Repository root path
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>}
 */
async function fetch(root) {
  try {
    const result = await execa('git', ['fetch'], { cwd: root });
    return {
      ok: true,
      stdout: result.stdout,
      stderr: result.stderr || '',
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
  }
}

/**
 * Check if local branch is behind remote (remote is ahead)
 * @param {string} root - Repository root path
 * @returns {Promise<boolean>} True if remote is ahead
 */
async function isRemoteAhead(root) {
  try {
    // First, get current branch
    const branch = await getBranch(root);
    if (!branch) return false;

    // Fetch to update remote refs
    await fetch(root);

    // Compare local with remote using rev-list
    // This counts commits that are in remote but not in local
    const result = await execa(
      'git',
      ['rev-list', '--count', `HEAD..origin/${branch}`],
      { cwd: root, reject: false }
    );

    if (result.exitCode !== 0) {
      // No remote tracking branch or other error
      return false;
    }

    const count = parseInt(result.stdout.trim(), 10);
    return count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Push to remote
 * @param {string} root - Repository root path
 * @param {string} branch - Branch name to push
 * @returns {Promise<{ok: boolean, stdout: string, stderr: string}>}
 */
async function push(root, branch) {
  try {
    const result = await execa('git', ['push', '-u', 'origin', branch], { cwd: root, reject: false });
    
    return {
      ok: result.exitCode === 0,
      stdout: result.stdout,
      stderr: result.stderr || '',
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
    };
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
