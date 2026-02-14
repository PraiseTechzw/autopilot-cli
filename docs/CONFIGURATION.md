# Configuration Reference - Autopilot CLI

**Built by Praise Masunga (PraiseTechzw)**

This document reflects the current `.autopilotrc.json` options.

---

## File Locations

- Config: `.autopilotrc.json` (repo root)
- Ignore: `.autopilotignore` (repo root)

---

## Full Example

```json
{
  "debounceSeconds": 20,
  "minSecondsBetweenCommits": 180,
  "autoPush": true,
  "blockBranches": ["main", "master"],
  "requireChecks": false,
  "checks": ["npm test"],
  "commitMessageMode": "smart",
  "teamMode": false,
  "maxFileSizeMB": 50,
  "preventSecrets": true
}
```

---

## Settings

### `debounceSeconds`
- **Type:** number
- **Default:** 20
- **Description:** Wait time after the last file change before checking git status.

### `minSecondsBetweenCommits`
- **Type:** number
- **Default:** 180
- **Description:** Minimum time between commits (anti-spam).

### `autoPush`
- **Type:** boolean
- **Default:** true
- **Description:** Push to `origin/<branch>` after commit.

### `blockedBranches`
- **Type:** string[]
- **Default:** `["main", "master"]`
- **Description:** Branches where auto-commit is disabled.

### `requireChecks`
- **Type:** boolean
- **Default:** false
- **Description:** Run checks before commit. If any fail, commit is skipped.

### `checks`
- **Type:** string[]
- **Default:** `[]`
- **Description:** Shell commands executed sequentially when `requireChecks` is true.

### `commitMessageMode`
- **Type:** `"smart" | "simple" | "ai"`
- **Default:** `"smart"`
- **Description:** 
  - smart: file/diff-based conventional messages
  - simple: `chore: update changes`
  - ai: uses configured AI provider (Gemini or Grok)

### `teamMode`
- **Type:** boolean
- **Default:** `false`
- **Description:** Enables pull-before-push and stricter conflict handling. Recommended for collaborative environments.

### `preCommitChecks.fileSize`
- **Type:** boolean
- **Default:** `true`
- **Description:** Prevent commits containing files larger than 50MB.

### `preCommitChecks.secrets`
- **Type:** boolean
- **Default:** `true`
- **Description:** Secret scan for common key/token patterns before committing.

---

## Ignore File (.autopilotignore)

Gitignore-style patterns. Example:

```
node_modules/
dist/
.env
*.log
```

Autopilot also always ignores `.git`, `.autopilot.pid`, and `autopilot.log`.
