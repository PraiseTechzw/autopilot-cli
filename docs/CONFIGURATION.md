# Configuration Reference - Autopilot CLI

**Built by Praise Masunga (PraiseTechzw)**

Complete reference for `.autopilotrc.json` configuration.

---

## CONFIGURATION HIERARCHY

Autopilot applies settings in this order (later overrides earlier):

1. **Defaults** (hardcoded in `src/config/defaults.js`)
2. **Environment Variables** (e.g., `AUTOPILOT_AUTO_PUSH=true`)
3. **Repository Config** (`.autopilotrc.json`)
4. **CLI Flags** (e.g., `autopilot start --no-push`)

---

## .AUTOPILOTRC.JSON SCHEMA

### Complete Example
```json
{
  "version": "1.0",
  
  "watchDebounceMs": 2000,
  "minCommitIntervalSec": 60,
  
  "autoPush": false,
  "pushRetries": 3,
  "pushTimeoutSec": 30,
  
  "protectedBranches": ["main", "master", "develop"],
  
  "commitMessage": "chore: autopilot update",
  "commitMessageMode": "smart",
  
  "safety": {
    "checkLargeFiles": true,
    "maxFileSizeKb": 100,
    "detectSensitiveFiles": true,
    "checkForConflicts": true,
    "checkRemoteTracking": true
  },
  
  "hooks": {
    "preCommit": null,
    "postCommit": null,
    "postPush": null
  },
  
  "logging": {
    "level": "info",
    "format": "text",
    "file": ".autopilot/autopilot.log"
  }
}
```

---

## CONFIGURATION PROPERTIES

### Global Settings

#### `version`
- **Type:** `string`
- **Default:** `"1.0"`
- **Description:** Config schema version
- **Purpose:** Future compatibility/migrations
- **Example:** `"version": "1.0"`

#### `watchDebounceMs`
- **Type:** `number` (milliseconds)
- **Default:** `2000`
- **Range:** `100` - `10000`
- **Description:** Wait time after file change before checking for commit
- **Purpose:** Prevents commit spam from rapid file changes
- **Example:**
  ```json
  "watchDebounceMs": 3000  // Wait 3 seconds
  ```

#### `minCommitIntervalSec`
- **Type:** `number` (seconds)
- **Default:** `60`
- **Range:** `10` - `3600`
- **Description:** Minimum time between commits
- **Purpose:** Prevents excessive commit history
- **Example:**
  ```json
  "minCommitIntervalSec": 120  // Max 1 commit every 2 minutes
  ```

---

### Push Settings

#### `autoPush`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Automatically push after commit
- **Override:** `AUTOPILOT_AUTO_PUSH=true`
- **Example:**
  ```json
  "autoPush": true
  ```
- **⚠️ Warning:** Requires `protectedBranches` safety check

#### `pushRetries`
- **Type:** `number`
- **Default:** `3`
- **Range:** `1` - `10`
- **Description:** Retry failed pushes with exponential backoff
- **Backoff:** 1s, 2s, 4s, 8s...
- **Example:**
  ```json
  "pushRetries": 5  // Try up to 5 times
  ```

#### `pushTimeoutSec`
- **Type:** `number` (seconds)
- **Default:** `30`
- **Range:** `10` - `300`
- **Description:** Timeout for single push attempt
- **Example:**
  ```json
  "pushTimeoutSec": 60  // Allow 60 seconds per push
  ```

---

### Branch Protection

#### `protectedBranches`
- **Type:** `array<string>`
- **Default:** `["main", "master", "develop"]`
- **Description:** Branches where auto-commit is disabled
- **Behavior:** File changes detected → Skipped, logged as warning
- **Override:** Add/remove branches as needed
- **Example:**
  ```json
  "protectedBranches": ["main", "master", "production"]
  ```

---

### Commit Settings

#### `commitMessage`
- **Type:** `string`
- **Default:** `"chore: autopilot update"`
- **Description:** Static commit message (when `commitMessageMode === "static"`)
- **Example:**
  ```json
  "commitMessage": "chore: automated commit"
  ```

#### `commitMessageMode`
- **Type:** `"smart" | "static" | "template"`
- **Default:** `"smart"`
- **Description:** How to generate commit messages

**Modes:**

| Mode | Example | Use Case |
|------|---------|----------|
| `smart` | "refactor: logger update" | Most projects (infers from files) |
| `static` | "chore: autopilot update" | CI/CD, simple builds |
| `template` | "autopilot: 2026-01-31 3 files" | Custom formatting |

**Example:**
```json
"commitMessageMode": "smart"
```

---

### Safety Configuration

#### `safety.checkLargeFiles`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Skip commits if files exceed size limit
- **Example:**
  ```json
  "safety": {
    "checkLargeFiles": true
  }
  ```

#### `safety.maxFileSizeKb`
- **Type:** `number` (kilobytes)
- **Default:** `100`
- **Range:** `10` - `10000`
- **Description:** File size limit for commits
- **Example:**
  ```json
  "safety": {
    "maxFileSizeKb": 200
  }
  ```

#### `safety.detectSensitiveFiles`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Block commits with `.env`, keys, credentials
- **Example:**
  ```json
  "safety": {
    "detectSensitiveFiles": true
  }
  ```

#### `safety.checkForConflicts`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Pause if merge conflicts detected
- **Example:**
  ```json
  "safety": {
    "checkForConflicts": true
  }
  ```

#### `safety.checkRemoteTracking`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Verify branch has upstream configured
- **Example:**
  ```json
  "safety": {
    "checkRemoteTracking": true
  }
  ```

---

### Hooks (Advanced)

#### `hooks.preCommit`
- **Type:** `string | null`
- **Default:** `null`
- **Description:** Command to run before commit
- **Example:**
  ```json
  "hooks": {
    "preCommit": "npm run lint"
  }
  ```
- **Behavior:** If command fails → skip commit

#### `hooks.postCommit`
- **Type:** `string | null`
- **Default:** `null`
- **Description:** Command to run after successful commit
- **Example:**
  ```json
  "hooks": {
    "postCommit": "npm run build"
  }
  ```

#### `hooks.postPush`
- **Type:** `string | null`
- **Default:** `null`
- **Description:** Command to run after successful push
- **Example:**
  ```json
  "hooks": {
    "postPush": "npm run deploy"
  }
  ```

---

### Logging

#### `logging.level`
- **Type:** `"debug" | "info" | "warn" | "error" | "fatal"`
- **Default:** `"info"`
- **Description:** Logging verbosity
- **Override:** `AUTOPILOT_LOG_LEVEL=debug`

#### `logging.format`
- **Type:** `"text" | "json"`
- **Default:** `"text"`
- **Description:** Log output format
- **Example:**
  ```json
  "logging": {
    "format": "json"  // For CI/CD parsing
  }
  ```

#### `logging.file`
- **Type:** `string` (path)
- **Default:** `".autopilot/autopilot.log"`
- **Description:** Log file location
- **Example:**
  ```json
  "logging": {
    "file": "/var/log/autopilot/autopilot.log"
  }
  ```

---

## ENVIRONMENT VARIABLES

Override config with environment variables:

```bash
# Core settings
AUTOPILOT_AUTO_PUSH=true
AUTOPILOT_DEBOUNCE_MS=3000
AUTOPILOT_MIN_COMMIT_INTERVAL=120

# Push settings
AUTOPILOT_PUSH_RETRIES=5
AUTOPILOT_PUSH_TIMEOUT=60

# Commit
AUTOPILOT_COMMIT_MESSAGE="chore: auto update"
AUTOPILOT_COMMIT_MESSAGE_MODE=smart

# Safety
AUTOPILOT_CHECK_LARGE_FILES=true
AUTOPILOT_MAX_FILE_SIZE=200
AUTOPILOT_DETECT_SENSITIVE_FILES=true

# Logging
AUTOPILOT_LOG_LEVEL=debug
AUTOPILOT_LOG_FORMAT=json
```

---

## .AUTOPILOTIGNORE SYNTAX

**File:** `.autopilotignore`

### Syntax
- Standard gitignore-style patterns
- `#` starts comments
- Blank lines ignored
- Glob patterns supported

### Examples
```
# Dependencies
node_modules/
.git/
.venv/
venv/

# Environment
.env
.env.local
.env.*.local

# Build artifacts
dist/
build/
.next/
.nuxt/
out/

# Logs
*.log
logs/
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/
```

---

## MINIMAL CONFIGURATION

Start with defaults:

```json
{}
```

Autopilot will use all defaults and work immediately.

---

## PRODUCTION CONFIGURATION

```json
{
  "version": "1.0",
  
  "watchDebounceMs": 2000,
  "minCommitIntervalSec": 60,
  
  "autoPush": true,
  "pushRetries": 5,
  "pushTimeoutSec": 60,
  
  "protectedBranches": ["main", "master"],
  
  "commitMessageMode": "smart",
  
  "safety": {
    "checkLargeFiles": true,
    "maxFileSizeKb": 100,
    "detectSensitiveFiles": true,
    "checkForConflicts": true,
    "checkRemoteTracking": true
  },
  
  "hooks": {
    "preCommit": "npm run lint",
    "postCommit": "npm run build",
    "postPush": null
  },
  
  "logging": {
    "level": "info",
    "format": "json",
    "file": ".autopilot/autopilot.log"
  }
}
```

---

## VALIDATE CONFIGURATION

Check your config is valid:

```bash
autopilot doctor
```

Output:
```
✓ Config file exists
✓ Config is valid JSON
✓ All required fields present
✓ No unknown fields
✓ Values within safe ranges
```

---

## GENERATE CONFIG

Create `.autopilotrc.json` from template:

```bash
autopilot init
```

This creates:
- `.autopilotrc.json` (with defaults)
- `.autopilotignore` (with common patterns)

---

**Last Updated:** January 31, 2026  
**Maintained by:** Praise Masunga (PraiseTechzw)
