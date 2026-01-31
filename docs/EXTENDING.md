# Extending Autopilot

**Built by Praise Masunga (PraiseTechzw)**

This guide describes extension points in the current implementation.

---

## 1. Require Checks (Pre-Commit Commands)

Use `requireChecks` and `checks` to run commands before a commit.

```json
{
  "requireChecks": true,
  "checks": ["npm test", "npm run lint"]
}
```

If any command fails, the commit and push are skipped.

---

## 2. Commit Message Modes

- `smart` uses file-based conventional commit messages
- `simple` uses `chore: update changes`

```json
{
  "commitMessageMode": "simple"
}
```

To customize the smart logic, update [src/core/commit.js](../src/core/commit.js).

---

## 3. Ignore Patterns

Add patterns to `.autopilotignore` to control what is watched:

```
node_modules/
dist/
.env
*.log
```

Autopilot always ignores `.git`, `.autopilot.pid`, and `autopilot.log`.

---

## 4. Programmatic API

You can use Autopilot as a library:

```javascript
const autopilot = require('autopilot-cli');

// Start watcher
const watcher = new autopilot.watcher(process.cwd());
await watcher.start();

// Git helpers
const branch = await autopilot.git.getBranch(process.cwd());
```

See [index.js](../index.js) for exported helpers.
