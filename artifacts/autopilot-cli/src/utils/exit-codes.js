/**
 * Autopilot CLI Exit Codes
 * A stable contract for standard/external consumers
 */

const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  NOT_GIT_REPO: 2,
  NOT_INITIALIZED: 3,
  BLOCKED_BRANCH: 4,
  INVALID_CONFIG: 5,
  WATCHER_ALREADY_RUNNING: 6,
  WATCHER_NOT_RUNNING: 7
};

module.exports = EXIT_CODES;
