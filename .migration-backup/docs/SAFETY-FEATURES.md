# Safety Features - Autopilot CLI

**Built by Praise Masunga (PraiseTechzw)**

This document reflects the safety behavior in the current implementation.

---

## 1. Blocked Branches

Autopilot refuses to commit on branches listed in `blockBranches` (default: `main`, `master`).

---

## 2. Remote Ahead Protection

Autopilot fetches and checks if the remote branch is ahead. If so, it pauses and instructs you to pull first.

---

## 3. Required Checks

If `requireChecks` is enabled, commands in `checks` run sequentially. Any failure stops the commit and push.

---

## 4. Debounce + Rate Limiting

- `debounceSeconds` waits for quiet time after changes
- `minSecondsBetweenCommits` prevents commit spam

---

## 5. Ignore Patterns + .git

- `.autopilotignore` applies gitignore-style patterns
- `.git` is always ignored
- Built‑in ignores: `.autopilot.pid`, `autopilot.log`

---

## 6. Graceful Errors

Errors are handled without crashing. Warnings are printed to the console, and verbose details go to `autopilot.log`.

---

## 7. PID Tracking

The watcher writes `.autopilot.pid` in the repo root on start and removes it on exit.

---

## Notes

Additional safety checks (like large-file or secret scanning) are planned but not part of the current implementation.
