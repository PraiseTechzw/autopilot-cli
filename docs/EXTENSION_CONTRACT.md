# Autopilot CLI — VS Code Extension Public Contract

> **Version:** 1.0 (CLI package `@traisetech/autopilot` v2.5.0+)  
> **Last Updated:** 2026-03-30  
> **Stability:** Stable — fields marked ⚠️ LEGACY may be removed in v3.

This document defines the **stable public contract** between the Autopilot CLI and any external consumer (such as the VS Code extension). The extension MUST NOT import internal source files from this package. All integration must go through the surfaces defined here.

---

## 1. Installation & Binary

```bash
npm install -g @traisetech/autopilot
```

After installation, the command `autopilot` is available globally.

**Package name:** `@traisetech/autopilot`  
**Binary entry point:** `bin/autopilot.js`  
**Bin mapping:** `"autopilot": "bin/autopilot.js"`  
**Node requirement:** `>=18.0.0`

### Version Detection

```bash
autopilot --version
autopilot -v
```

Output is a semver string on stdout, e.g. `2.5.0`. Exit code: `0`.

---

## 2. Commands Reference

All commands run from the repository root (the CWD must be a git repo for most commands).

| Command | Description | `--json` | Notes |
|---------|-------------|----------|-------|
| `autopilot init` | Initialize configuration | ❌ | Interactive; skips existing files |
| `autopilot start` | Start watcher (foreground) | ✅ | Blocks until stopped |
| `autopilot stop` | Stop running watcher | ❌ | Sends SIGTERM |
| `autopilot status` | Show watcher status | ✅ | Reads `.autopilot-state.json` |
| `autopilot doctor` | Diagnose environment | ✅ | Always exits 0 in human mode |
| `autopilot pause [reason]` | Pause watcher | ❌ | Writes to state file |
| `autopilot resume` | Resume watcher | ❌ | Writes to state file |
| `autopilot undo [-c n]` | Undo last n commits | ❌ | Uses `.autopilot/history.json` |
| `autopilot config list` | List effective config | ✅ | |
| `autopilot config get <key>` | Get config value | ✅ | |
| `autopilot config set <key> <val>` | Set config value | ✅ | |
| `autopilot doctor` | Full env health check | ✅ | |

---

## 3. Exit Codes

These exit codes are stable. The extension can use them for decision logic.

| Code | Constant | Meaning |
|------|----------|---------|
| `0` | `SUCCESS` | OK / no action needed |
| `1` | `GENERAL_ERROR` | Unexpected runtime failure |
| `2` | `NOT_GIT_REPO` | CWD is not inside a git repo |
| `3` | `NOT_INITIALIZED` | No `.autopilotrc.json` found |
| `4` | `BLOCKED_BRANCH` | Current branch is in `blockedBranches` |
| `5` | `INVALID_CONFIG` | `.autopilotrc.json` fails schema validation |
| `6` | `WATCHER_ALREADY_RUNNING` | `autopilot start` when already running |
| `7` | `WATCHER_NOT_RUNNING` | `autopilot status --json` with no state file |

> **Important:** `autopilot doctor` (human mode) **always exits 0** even when issues are found, to avoid breaking pipelines. Use `--json` mode and check `issuesCount > 0` for programmatic failure detection.

---

## 4. JSON Output Contracts

All `--json` commands output to **stdout** only. Errors are included in the JSON payload rather than stderr.

### 4.1 `autopilot status --json`

**When watcher is not running** (exit code `7`):
```json
{
  "status": "not running",
  "error": "State file missing"
}
```

**When watcher state is readable** (exit code `0`):
```json
{
  "running": true,
  "pid": 12345,
  "branch": "feature/my-branch",
  "branchBlocked": false,
  "lastCommitHash": "abc1234",
  "lastCommitMessage": "feat: add feature",
  "lastCommitAt": 1711824000000,
  "lastPushHash": "abc1234",
  "lastPushStatus": "succeeded",
  "lastPushAt": 1711824100000,
  "queueDepth": 0,
  "conflicts": null,
  "watchPath": "/path/to/repo",
  "status": "running",
  "error": null,
  "version": 1
}
```

**Field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `running` | `boolean` | Whether the watcher process is alive |
| `pid` | `number \| null` | OS process ID of the watcher |
| `branch` | `string` | Current git branch |
| `branchBlocked` | `boolean` | Whether pushes are blocked on this branch |
| `lastCommitHash` | `string \| null` | Full SHA of last AP commit |
| `lastCommitMessage` | `string \| null` | Commit message |
| `lastCommitAt` | `number \| null` | Unix timestamp (ms) |
| `lastPushHash` | `string \| null` | Full SHA of last pushed commit |
| `lastPushStatus` | `"succeeded" \| "queued" \| null` | Push result |
| `lastPushAt` | `number \| null` | Unix timestamp (ms) |
| `queueDepth` | `number` | Pending retry jobs |
| `conflicts` | `string \| null` | Conflict description or null |
| `watchPath` | `string` | Absolute path being watched |
| `status` | `string` | `"running"`, `"paused"`, `"stopped"`, `"committing"`, `"pushing"` |
| `error` | `string \| null` | Error message if read failed |
| `version` | `number` | Schema version (currently `1`) |

---

### 4.2 `autopilot doctor --json`

**Exit code:** `0` if all pass, `1` if any check fails.

```json
{
  "health": "good",
  "issuesCount": 0,
  "diagnostics": [
    { "check": "Node.js version >= 18", "pass": true, "details": "v20.11.0" },
    { "check": "Git installed", "pass": true, "details": "git version 2.43.0" },
    { "check": "Inside a git repo", "pass": true, "details": "yes" },
    { "check": ".autopilotrc.json valid", "pass": true, "details": "found and valid" },
    { "check": "AI Configuration", "pass": true, "details": "API key present for provider: grok" },
    { "check": "Remote origin reachable", "pass": true, "details": "https://github.com/user/repo.git" },
    { "check": "Branch safety", "pass": true, "details": "Current branch \"main\" is not protected" },
    { "check": "Watcher consistency", "pass": true, "details": "Stopped" }
  ]
}
```

**Field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `health` | `"good" \| "poor"` | Overall health summary |
| `issuesCount` | `number` | Number of failing checks |
| `diagnostics` | `array` | Per-check results |
| `diagnostics[].check` | `string` | Check name (stable identifier) |
| `diagnostics[].pass` | `boolean` | Whether check passed |
| `diagnostics[].details` | `string \| null` | Human-readable detail |

**Stable check names:**
- `Node.js version >= 18`
- `Git installed`
- `Inside a git repo`
- `.autopilotrc.json exists`
- `.autopilotrc.json valid`
- `AI Configuration`
- `Remote origin reachable`
- `Branch safety`
- `Watcher consistency`

---

### 4.3 `autopilot config list --json`

Outputs the full effective merged configuration object. Shape matches `.autopilotrc.json` schema (see `docs/CONFIGURATION.md`).

### 4.4 `autopilot config get <key> --json`

```json
{ "ai.provider": "grok" }
```

### 4.5 `autopilot config set <key> <value> --json`

```json
{ "success": true, "key": "debounceSeconds", "value": 30, "global": false }
```

---

## 5. State File Schema (`.autopilot-state.json`)

This file is written atomically (temp + rename) by the watcher process.  
**Location:** `<repoRoot>/.autopilot-state.json`  
**Consumers:** extension, `status` command, `doctor` command.

```json
{
  "version": 1,
  "repoRoot": "/path/to/repo",
  "repoName": "my-project",
  "running": true,
  "paused": false,
  "status": "running",
  "reason": null,
  "branch": "main",
  "branchBlocked": false,
  "health": "good",
  "lastCommitHash": "abc1234...",
  "lastCommitMessage": "feat: update readme",
  "lastCommitAt": 1711824000000,
  "lastPushHash": "abc1234...",
  "lastPushStatus": "succeeded",
  "lastPushAt": 1711824100000,
  "queueDepth": 0,
  "conflicts": null,
  "watcherPid": 12345,
  "updatedAt": "2026-03-30T20:00:00.000Z",
  "teamMode": false,
  "aiMode": "grok",
  "startedAt": "2026-03-30T19:00:00.000Z",
  "watchPath": "/path/to/repo",
  "uptime": 3600
}
```

**Schema field reference:**

| Field | Type | Stable | Description |
|-------|------|--------|-------------|
| `version` | `number` | ✅ | Schema version — currently `1` |
| `repoRoot` | `string` | ✅ | Absolute path to repo root |
| `repoName` | `string` | ✅ | `basename(repoRoot)` |
| `running` | `boolean` | ✅ | Derived: `status === 'running'` or `'watching'` |
| `paused` | `boolean` | ✅ | Derived: `status === 'paused'` |
| `status` | `string` | ✅ | `"running"`, `"paused"`, `"stopped"`, `"committing"`, `"pushing"`, `"watching"` |
| `reason` | `string \| null` | ✅ | Pause reason |
| `branch` | `string` | ✅ | Current git branch |
| `branchBlocked` | `boolean` | ✅ | Whether push is blocked |
| `health` | `string` | ✅ | `"good"`, `"poor"`, `"unknown"` |
| `lastCommitHash` | `string \| null` | ✅ | Full SHA |
| `lastCommitMessage` | `string \| null` | ✅ | Commit message |
| `lastCommitAt` | `number \| null` | ✅ | Unix ms timestamp |
| `lastPushHash` | `string \| null` | ✅ | Full SHA of last push |
| `lastPushStatus` | `string \| null` | ✅ | `"succeeded"`, `"queued"`, or null |
| `lastPushAt` | `number \| null` | ✅ | Unix ms timestamp |
| `queueDepth` | `number` | ✅ | Retry job count |
| `conflicts` | `string \| null` | ✅ | Conflict description or null |
| `watcherPid` | `number \| null` | ✅ | OS PID of watcher process |
| `updatedAt` | `string` | ✅ | ISO 8601 timestamp of last write |
| `teamMode` | `boolean` | ✅ | Whether team mode is active |
| `aiMode` | `string` | ✅ | `"grok"`, `"gemini"`, `"disabled"`, `"System"` |
| `startedAt` | `string` | ✅ | ISO 8601 watcher start time |
| `watchPath` | `string` | ✅ | Absolute path being watched |
| `uptime` | `number` | ✅ | Seconds since watcher start |
| `pid` | `number \| null` | ⚠️ LEGACY | Use `watcherPid`. Same value. |
| `pausedAt` | `string \| null` | ⚠️ LEGACY | Use `reason` + `updatedAt` |
| `lastCommit` | `object \| null` | ⚠️ LEGACY | Use flat fields above |
| `lastPush` | `object \| null` | ⚠️ LEGACY | Use flat fields above |
| `queueLength` | `number` | ⚠️ LEGACY | Use `queueDepth` |
| `isProtected` | `boolean` | ⚠️ LEGACY | Use `branchBlocked` |

---

## 6. Log File (`.autopilot.log`)

**Location:** `<repoRoot>/.autopilot.log`  
**Format:** `[ISO-8601 timestamp] LEVEL: message`

```
[2026-03-30T20:00:01.000Z] INFO: Starting Autopilot watcher...
[2026-03-30T20:00:02.000Z] SUCCESS: Autopilot is watching /path/to/repo
[2026-03-30T20:01:00.000Z] INFO: Committing changes...
[2026-03-30T20:01:01.000Z] SUCCESS: Commit complete
```

**Rotation:** Automatically trimmed to last 200 lines when file exceeds 500KB.  
**Lifecycle:** Created on `start`, deleted on `stop`.

---

## 7. PID File (`.autopilot.pid`)

**Location:** `<repoRoot>/.autopilot.pid`  
**Content:** Plain text integer (PID of watcher process)  
**Use:** Check if watcher is running:

```bash
# Process alive if kill -0 succeeds
kill -0 $(cat .autopilot.pid)
```

Deleted by `autopilot stop`. Stale PIDs are cleaned up automatically.

---

## 8. Known Mismatches / Extension Compatibility Notes

> These are areas where the current extension code may be making wrong assumptions about the CLI.

### 8.1 `status` field values — `'running'` vs `'watching'`

The `status` field in `.autopilot-state.json` can be both `'running'` and `'watching'` for an active watcher. The extension must treat both as "running":

```js
const isRunning = state.status === 'running' || state.status === 'watching' || state.running === true;
```

### 8.2 Timestamp format — ms vs ISO string

- `lastCommitAt`, `lastPushAt` → **Unix milliseconds** (`number`), not ISO string
- `updatedAt`, `startedAt`, `pausedAt` → **ISO 8601 string**

Do not assume all timestamps are the same format.

### 8.3 PID field naming

Both `pid` (legacy) and `watcherPid` (new) exist. Use `watcherPid` going forward:

```js
const pid = state.watcherPid ?? state.pid;
```

### 8.4 `doctor` exit code in human mode

`autopilot doctor` (without `--json`) **always exits 0** even when issues are found. Use `--json` for reliable programmatic health checks:

```bash
autopilot doctor --json
# Exit code 1 = issues found, exit code 0 = all clear
```

### 8.5 `config list` outputs JSON by default

`autopilot config list` already outputs JSON unconditionally (no `--json` flag needed for list). The `--json` flag is mostly meaningful for `get` and `set`.

### 8.6 State file written atomically — no partial reads

The state file is written via temp file + rename, so reads will always see a complete file. The extension does **not** need to handle partial JSON. However, it should still guard against the file not existing (watcher not started yet).

### 8.7 `stop` deletes the state file

After `autopilot stop`, **both** `.autopilot-state.json` and `.autopilot.log` are deleted. The extension must treat a missing state file as "watcher stopped", not "error".

---

## 9. Recommended Extension Integration Patterns

### Polling status

```js
// Poll every 2-5 seconds while panel is visible
const result = await exec('autopilot status --json', { cwd: repoPath });
const state = JSON.parse(result.stdout);
if (state.error === 'State file missing') {
  // watcher not running
}
```

### Starting the watcher

```js
const proc = spawn('autopilot', ['start'], { cwd: repoPath });
// Listen for exit code 6 = WATCHER_ALREADY_RUNNING
proc.on('exit', (code) => {
  if (code === 6) { /* already running */ }
  if (code === 2) { /* not a git repo */ }
  if (code === 3) { /* not initialized */ }
});
```

### Health check before start

```js
const result = await exec('autopilot doctor --json', { cwd: repoPath });
const report = JSON.parse(result.stdout);
if (report.health === 'poor') {
  // Show diagnostics to user
  for (const check of report.diagnostics.filter(d => !d.pass)) {
    showError(`${check.check}: ${check.details}`);
  }
}
```

---

## 10. Files That Must Be Gitignored

These files are generated at runtime and must not be committed:

```gitignore
.autopilot.log
.autopilot.pid
.autopilot-state.json
.autopilot/
```

`autopilot init` automatically adds these to `.gitignore`.
