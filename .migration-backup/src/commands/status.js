/**
 * Autopilot status command
 * Built by Praise Masunga (PraiseTechzw)
 */

const fs = require('fs-extra');
const path = require('path');
// const { formatDistanceToNow } = require('date-fns'); // Removed unused dependency
const git = require('../core/git');
const safety = require('../core/safety');

const EXIT_CODES = require('../utils/exit-codes');

async function status(options = {}) {
  const isJson = !!options.json;
  const root = process.cwd();
  const statePath = path.join(root, '.autopilot-state.json');
  const queuePath = path.join(root, '.autopilot-queue.json');

  if (!isJson) {
    console.log('\n  Autopilot status');
    console.log('  ─────────────────────────────');
  }

  if (!fs.existsSync(statePath)) {
    if (isJson) {
      console.log(JSON.stringify({ status: 'not running', error: 'State file missing' }, null, 2));
      process.exit(EXIT_CODES.WATCHER_NOT_RUNNING);
    } else {
      console.error('Status: Not Running');
      console.log('  ─────────────────────────────');
    }
    return;
  }

  try {
    const state = fs.readJsonSync(statePath);
    const pid = state.pid || state.watcherPid; // support both legacy and new
    let alive = false;
    
    if (pid) {
      try {
        process.kill(pid, 0);
        alive = true;
      } catch (e) {
        alive = false;
      }
    }

    const branch = state.branch || await git.getBranch(root) || 'unknown';
    // Check if protected
    // Read config to get protected branches
    const configPath = path.join(root, '.autopilotrc.json');
    let config = {};
    if (fs.existsSync(configPath)) {
      config = fs.readJsonSync(configPath);
    }
    const isProtected = safety.isProtectedBranch(branch, config);

    let queueLength = 0;
    if (fs.existsSync(queuePath)) {
      const queue = fs.readJsonSync(queuePath);
      queueLength = queue.length;
    }

    if (isJson) {
      const output = {
        running: alive,
        pid: pid || null,
        branch,
        branchBlocked: isProtected,
        lastCommitHash: state.lastCommitHash || null,
        lastCommitMessage: state.lastCommitMessage || null,
        lastCommitAt: state.lastCommitAt || null,
        lastPushHash: state.lastPushHash || null,
        lastPushStatus: state.lastPushStatus || null,
        lastPushAt: state.lastPushAt || null,
        queueDepth: queueLength,
        conflicts: state.conflicts || null,
        watchPath: state.watchPath || root,
        status: alive ? (state.status || 'watching') : 'stopped',
        error: null,
        version: state.version || 1
      };
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    const relativeTime = (ts) => {
      if (!ts) return 'never';
      const diff = Date.now() - ts;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins} min ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)} days ago`;
    };

    const uptime = () => {
      if (!state.startedAt) return 'unknown';
      const diff = Date.now() - state.startedAt;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      return `${hours}h ${mins}m`;
    };

    console.log(`  State:          ${alive ? (state.status || 'watching') : 'stopped'}`);
    console.log(`  Branch:         ${branch}${isProtected ? ' (PROTECTED — push blocked)' : ''}`);
    console.log(`  Last commit:    ${state.lastCommitHash ? state.lastCommitHash.substring(0, 7) : 'none'} — "${state.lastCommitMessage || 'none'}" (${relativeTime(state.lastCommitAt)})`);
    console.log(`  Last push:      ${state.lastPushHash ? state.lastPushHash.substring(0, 7) : 'none'} — ${state.lastPushStatus || 'none'} (${relativeTime(state.lastPushAt)})`);
    console.log(`  Pending queue:  ${queueLength} jobs waiting to push`);
    console.log(`  Conflicts:      ${state.conflicts || 'none detected'}`);
    console.log(`  Watching:       ${state.watchPath || root}`);
    console.log(`  Uptime:         ${uptime()}`);
  } catch (err) {
    if (isJson) {
      console.log(JSON.stringify({ running: false, error: err.message }, null, 2));
    } else {
      console.log(`  Error:          Could not read state: ${err.message}`);
    }
  }

  if (!isJson) {
    console.log('  ─────────────────────────────');
  }
}

module.exports = status;
