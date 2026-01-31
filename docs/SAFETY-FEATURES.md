# Safety Features - Autopilot CLI

**Built by Praise Masunga (PraiseTechzw)**

This document explains all safety mechanisms that protect your repository from unwanted or dangerous commits.

---

## 1. PROTECTED BRANCHES

**What it does:** Refuses to auto-commit on protected branches.

**Default protected branches:**
```json
"protectedBranches": ["main", "master", "develop"]
```

**Behavior:**
- User switches to `main` → Autopilot pauses
- File changes detected → Autopilot logs warning
- No commit/push executed
- User manually switches to dev branch → Autopilot resumes

**Override:** Edit `.autopilotrc.json` to customize protected branches.

---

## 2. DIRTY STATE CHECK

**What it does:** Aborts if working directory is already dirty from user.

**Scenario:**
1. User has uncommitted changes from manual editing
2. Autopilot detects changes
3. Before committing Autopilot's changes, checks for conflicts
4. If conflicts found → abort, alert user

**Why:** Prevents accidental loss of manual work.

---

## 3. LARGE FILE DETECTION

**What it does:** Warns before committing large files.

**Configuration:**
```json
"safety": {
  "checkLargeFiles": true,
  "maxFileSizeKb": 100
}
```

**Behavior:**
- File > 100 KB detected → Log warning, skip commit
- File < 100 KB → Proceed with commit
- User can override in `.autopilotrc.json`

**Why:** Prevents accidental commits of binaries, node_modules, etc.

---

## 4. SENSITIVE FILE DETECTION

**What it does:** Blocks commits containing secrets or sensitive files.

**Detected patterns:**
- `.env`, `.env.local`, `.env.production`
- `private.key`, `secret.key`, `credentials.json`
- AWS credentials, API keys
- Docker secrets

**Behavior:**
- Sensitive file detected → Skip commit, alert user
- File removed from `.gitignore` → Autopilot blocks

**Why:** Prevents accidental exposure of secrets.

---

## 5. CONFLICT DETECTION

**What it does:** Pauses Autopilot if merge conflicts detected.

**Conflict markers detected:**
```
<<<<<<< HEAD
>>>>>>> branch-name
```

**Behavior:**
- Conflict markers found → Autopilot pauses
- Alert: "Merge conflicts detected, resolve manually"
- Autopilot resumes after conflict resolution

**Why:** Prevents breaking the repo by committing broken merges.

---

## 6. REMOTE TRACKING CHECK

**What it does:** Verifies branch is tracking a remote.

**Scenario:**
1. User creates new local branch
2. No upstream tracking configured
3. Autopilot detects → requests setup
4. User runs `git push -u origin branch-name`
5. Autopilot resumes

**Why:** Prevents orphaned branches and push failures.

---

## 7. COMMIT MESSAGE TEMPLATES

**What it does:** Generates intelligent, conventional-commit style messages.

**Modes:**

### Mode 1: Smart (Default)
```
Analyzes changed files → generates context-aware messages

src/utils/logger.js → "refactor: improve logging"
docs/README.md     → "docs: update documentation"
test/unit.test.js  → "test: add unit tests"
package.json       → "chore: update dependencies"
```

### Mode 2: Custom Template
```json
"commitMessage": "autopilot: {timestamp} - {fileCount} files updated"
```

### Mode 3: Static Message
```json
"commitMessage": "chore: automated commit"
```

**Why:** Meaningful commit history, not spam messages.

---

## 8. DEBOUNCING & RATE LIMITING

**What it does:** Prevents commit spam from file changes.

**Configuration:**
```json
"watchDebounceMs": 2000,
"minCommitIntervalSec": 60
```

**Behavior:**
- File change detected → Wait 2 seconds
- If more changes in 2 seconds → Reset timer
- After 2 seconds of silence → Commit
- After commit → Wait 60 seconds before next commit

**Why:** Real development has file bursts, not single changes.

---

## 9. DRY-RUN MODE

**What it does:** Simulates commits without actual git operations.

**Usage:**
```bash
autopilot start --dry-run
```

**Output:**
```
[DRY RUN] Would commit: "refactor: logger update"
[DRY RUN] Would push to: origin/feature-x
```

**Why:** Test configuration before enabling auto-commit.

---

## 10. PRE-COMMIT HOOKS

**What it does:** Runs custom validation before each commit.

**Example:**
```json
"hooks": {
  "preCommit": "npm run lint && npm run test"
}
```

**Behavior:**
- Changes detected → Run `npm run lint`
- If lint passes → Run `npm run test`
- If tests pass → Commit
- If any fails → Skip commit, alert user

**Why:** Ensures only passing code is committed.

---

## 11. PUSH RETRY WITH BACKOFF

**What it does:** Handles temporary network failures gracefully.

**Configuration:**
```json
"pushRetries": 3
```

**Behavior:**
- Push fails → Wait 1 second, retry
- Retry fails → Wait 2 seconds, retry
- Retry fails → Wait 4 seconds, final retry
- All retries fail → Log error, alert user, continue watching

**Why:** Handles temporary network hiccups without losing work.

---

## 12. GRACEFUL SHUTDOWN

**What it does:** Ensures no partial commits on shutdown.

**On SIGINT (Ctrl+C):**
1. Stop watching new files
2. Finish current operation (if any)
3. Save daemon state
4. Clean up resources
5. Exit

**Why:** Prevents corruption from abrupt termination.

---

## 13. HEALTH CHECKS

**What it does:** Monitors daemon health continuously.

**Checks:**
- Daemon process still running?
- Watch handle still active?
- Config still valid?
- Disk space available?

**Behavior:**
- Check fails → Alert user, suggest restart
- `autopilot status` shows health

**Why:** Early detection of daemon issues.

---

## 14. IGNORE PATTERN SUPPORT

**What it does:** Prevents watching specific files/directories.

**File:** `.autopilotignore`

**Example:**
```
node_modules/
.git/
.env*
build/
dist/
coverage/
temp/
```

**Why:** Reduces noise, improves performance.

---

## SAFETY CONFIGURATION EXAMPLES

### Conservative Setup (Default)
```json
{
  "protectedBranches": ["main", "master"],
  "autoPush": false,
  "minCommitIntervalSec": 60,
  "safety": {
    "checkLargeFiles": true,
    "maxFileSizeKb": 50,
    "detectSensitiveFiles": true,
    "checkForConflicts": true
  }
}
```

### Moderate Setup
```json
{
  "protectedBranches": ["main", "master", "develop"],
  "autoPush": false,
  "minCommitIntervalSec": 30,
  "safety": {
    "checkLargeFiles": true,
    "maxFileSizeKb": 200,
    "detectSensitiveFiles": true,
    "checkForConflicts": true
  }
}
```

### Aggressive Setup (CI/CD Only)
```json
{
  "protectedBranches": ["main"],
  "autoPush": true,
  "minCommitIntervalSec": 10,
  "safety": {
    "checkLargeFiles": false,
    "detectSensitiveFiles": false,
    "checkForConflicts": true
  }
}
```

---

## MONITORING & ALERTS

### View Autopilot Logs
```bash
autopilot status --logs
# or
tail -f ~/.autopilot/autopilot.log
```

### Understand Log Levels
- `DEBUG` - Detailed operation info
- `INFO` - Commit/push events
- `WARN` - Safety checks triggered
- `ERROR` - Operation failures
- `FATAL` - Daemon shutdown

### Alert Examples
```
⚠️  WARNING: Protected branch detected (main)
⚠️  WARNING: Large file detected (150 KB > 100 KB limit)
⚠️  WARNING: Sensitive file detected (.env)
⚠️  WARNING: Merge conflict detected, resolve manually
❌ ERROR: Failed to push (network error), retrying...
```

---

## DISABLE SAFETY (NOT RECOMMENDED)

If you understand the risks, disable specific checks:

```json
{
  "safety": {
    "checkLargeFiles": false,
    "detectSensitiveFiles": false,
    "checkForConflicts": false
  }
}
```

**⚠️ WARNING:** This removes critical protections. Use only in controlled environments (e.g., CI/CD with no secrets).

---

## TROUBLESHOOTING SAFETY ISSUES

### Autopilot refuses to commit
```bash
autopilot doctor
```

This command diagnoses:
- Large files blocking commits
- Sensitive files detected
- Merge conflicts
- Protected branch status
- Network connectivity

### False positives on sensitive files
Update `.autopilotignore`:
```
!.env.example  # This file is safe
```

### Need to commit a large file
Temporarily increase limit:
```json
"maxFileSizeKb": 500
```

Then reset after commit.

---

## REPORT SECURITY ISSUES

If you discover a safety vulnerability:

1. **Do NOT create public issues**
2. Email: security@praisetechzw.dev
3. Include: description, reproduction steps
4. Do not disclose until fix is released

**Attribution:** Responsible disclosures are credited in CHANGELOG.md

---

**Last Updated:** January 31, 2026  
**Maintained by:** Praise Masunga (PraiseTechzw)
