# Autopilot CLI Audit & Implementation Plan

## 1. Audit Summary of Current CLI Issues
- **Package name/Dependencies**: `package.json` contains a circular dependency on `@traisetech/autopilot` and has an odd `bin` mapping.
- **JSON Output**: Commands like `status`, `doctor`, and `config list` do not support the `--json` flag, making them hard for the VS Code extension to consume systemically.
- **Exit Codes**: Currently, explicit failure modes don't use standardized exit codes (many just log an error or `process.exit(1)`).
- **State File (`.autopilot-state.json`)**: Written by `core/state.js` and `core/watcher.js` (and maybe others), but it lacks a versioned structure and fields like `repoName`, `branchBlocked`, etc. Non-atomic reads/writes can cause parsing errors.
- **Doctor**: Functional, but `doctor.js` checks gemini vs grok key incorrectly based on process env and cannot output JSON format. It needs to check if the watcher is consistent.
- **Init**: Doesn't effectively verify existing files, duplication can occur in `.gitignore` if not handled rigorously, and it doesn't always exit nicely with standard codes.

## 2. File-by-File Implementation Plan

### `package.json`
- Remove the self-referential `@traisetech/autopilot` dependency.

### `src/utils/exit-codes.js` (NEW)
- Define a dictionary of exit codes (SUCCESS=0, GENERL_ERROR=1, NOT_GIT_REPO=2, NOT_INITIALIZED=3, BLOCKED_BRANCH=4, INVALID_CONFIG=5, WATCHER_ALREADY_RUNNING=6, WATCHER_NOT_RUNNING=7).

### `bin/autopilot.js`
- Update `program.command('status')`, `doctor`, and `config` to specify `.option('--json', 'Output JSON format')`.

### `src/commands/status.js`
- Accept `options`. If `options.json` is true, collect all status data into an object and `console.log(JSON.stringify(data, null, 2))`.
- Update state reading logic to use the unified state fields.

### `src/commands/doctor.js`
- Accept `options`. Perform the checks, gather results in a `diagnostics` array, and output JSON if `--json` is found.
- Map the explicit exit codes for issues if necessary, or just exit 0 with issues detailed.

### `src/commands/config.js`
- Check options. If `options.json` is true, log the config object as pure JSON when using `list` or `get`. 

### `src/core/state.js`
- Update `StateManager` class or export functions to support writing a versioned state schema atomicly. 
- Ensure fields: `version`, `repoRoot`, `repoName`, `running`, `paused`, `branch`, `branchBlocked`, `health`, `lastCommit`, `lastPush`, `queueDepth`, `conflictDetected`, `watcherPid`, `updatedAt`, `teamMode`, `aiMode`.

### `src/commands/init.js`
- Restructure file creation (like `.autopilotrc.json` and `.gitignore`) to ensure idempotency. Use standard exit codes.

### `src/core/watcher.js` (Review required)
- Update it to use the new `state.js` structure when writing its state file.

### `docs/README.md`
- Document `--json` flags, Exit Codes, and `.autopilot-state.json` API.
