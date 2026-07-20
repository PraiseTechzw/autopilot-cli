# Autopilot CLI - Architecture

**Built by Praise Masunga (PraiseTechzw)**

This document reflects the current implementation of Autopilot CLI.

---

## Current Project Structure

```
autopilot-cli/
├── bin/
│   └── autopilot.js            # CLI entrypoint (Commander)
├── src/
│   ├── commands/               # CLI command handlers
│   │   ├── init.js
│   │   ├── start.js
│   │   ├── stop.js
│   │   ├── status.js
│   │   └── doctor.js
│   ├── core/                   # Core logic
│   │   ├── watcher.js          # Watcher engine
│   │   ├── git.js              # Git helper utilities
│   │   ├── commit.js           # Smart commit message logic
│   │   └── safety.js           # Basic validation stubs
│   ├── config/                 # Configuration + ignore parsing
│   │   ├── defaults.js
│   │   ├── loader.js
│   │   └── ignore.js
│   └── utils/                  # Utilities
│       ├── logger.js
│       ├── paths.js
│       └── process.js
├── docs/                       # Documentation
├── test/                       # Tests (node:test)
├── README.md
└── index.js                    # Programmatic API
```

---

## Runtime Flow (Start)

```
autopilot start
  -> src/commands/start.js
    -> new Watcher(repoPath)
      -> core/watcher.js
        -> chokidar watches repo
        -> debounce + rate limit
        -> git status
        -> commit message (core/commit.js)
        -> git add/commit
        -> git push (optional)
```

---

## Key Responsibilities

### CLI Layer
- `bin/autopilot.js` wires commands via Commander
- `src/commands/*` are thin handlers that call core logic

### Core Layer
- `core/watcher.js` orchestrates watching, debouncing, safety checks, and git actions
- `core/git.js` wraps git commands with safe results
- `core/commit.js` generates smart conventional commit messages

### Config Layer
- `.autopilotrc.json` is loaded at runtime
- `.autopilotignore` patterns are loaded and merged with built‑ins

### Utils
- PID management and signal handling in `utils/process.js`
- Logging via `utils/logger.js`
- Path helpers in `utils/paths.js`

---

## Logs and State

- PID file: `.autopilot.pid` in repo root
- Log file: `autopilot.log` in repo root

---

## Programmatic API

`index.js` exports the command handlers and core utilities for reuse.

See [docs/EXTENDING.md](EXTENDING.md) for examples.
# Autopilot CLI - Architecture Design Document

**Built by Praise Masunga (PraiseTechzw)**  
**Repository:** github.com/praisetechzw/autopilot-cli

---

## 1. PRODUCTION-GRADE FOLDER STRUCTURE

```
autopilot-cli/
│
├── bin/
│   └── autopilot.js                    # CLI entrypoint, executable wrapper
│
├── src/
│   ├── cli/                            # CLI interface layer
│   │   ├── commands/                   # Command implementations
│   │   │   ├── init.js                 # Initialize repo config
│   │   │   ├── start.js                # Start watcher daemon
│   │   │   ├── stop.js                 # Stop watcher daemon
│   │   │   ├── status.js               # Show watcher status
│   │   │   └── doctor.js               # Diagnose & validate setup
│   │   ├── input-parser.js             # Parse CLI args & flags
│   │   └── output-formatter.js         # Format console output
│   │
│   ├── core/                           # Business logic layer
│   │   ├── watcher.js                  # File system watcher orchestrator
│   │   ├── git-executor.js             # Git command execution wrapper
│   │   ├── commit-engine.js            # Smart commit logic & message generation
│   │   ├── branch-guard.js             # Safety checks (branch protection, etc)
│   │   ├── event-debouncer.js          # File event debouncing
│   │   └── signal-handler.js           # Process signal handling (SIGINT, etc)
│   │
│   ├── config/                         # Configuration management
│   │   ├── config-loader.js            # Load & merge configs
│   │   ├── config-validator.js         # Validate config schema
│   │   ├── defaults.js                 # Default configuration values
│   │   ├── ignore-parser.js            # Parse .autopilotignore
│   │   └── schema.json                 # JSON Schema for .autopilotrc.json
│   │
│   ├── daemon/                         # Process & state management
│   │   ├── daemon-manager.js           # PID file, process lifecycle
│   │   ├── state-store.js              # Persistent state (JSON)
│   │   ├── lock-manager.js             # File-based locking
│   │   └── health-check.js             # Daemon health monitoring
│   │
│   ├── safety/                         # Safety & validation
│   │   ├── safety-checks.js            # Pre-commit validations
│   │   ├── file-analyzer.js            # Detect large/sensitive files
│   │   ├── branch-detector.js          # Current branch detection
│   │   └── conflict-resolver.js        # Handle merge conflicts
│   │
│   ├── logger/                         # Logging & output
│   │   ├── logger.js                   # Structured logger
│   │   ├── log-levels.js               # Log level constants
│   │   └── formatters.js               # Output formatting (JSON, text, etc)
│   │
│   ├── utils/                          # Utility functions
│   │   ├── fs-utils.js                 # File system helpers
│   │   ├── path-helpers.js             # Path resolution
│   │   ├── os-helpers.js               # OS-specific utilities
│   │   ├── retry-logic.js              # Retry with exponential backoff
│   │   └── error-handler.js            # Centralized error handling
│   │
│   ├── types/                          # JSDoc type definitions (CommonJS)
│   │   ├── config.types.js             # Config type definitions
│   │   ├── daemon.types.js             # Daemon type definitions
│   │   └── errors.types.js             # Error type definitions
│   │
│   └── index.js                        # Main export (for programmatic use)
│
├── test/                               # Test suite
│   ├── unit/                           # Unit tests
│   │   ├── config.test.js
│   │   ├── git-executor.test.js
│   │   ├── commit-engine.test.js
│   │   └── branch-guard.test.js
│   ├── integration/                    # Integration tests
│   │   ├── watcher.test.js
│   │   ├── daemon.test.js
│   │   └── commands.test.js
│   └── fixtures/                       # Test data & fixtures
│
├── docs/                               # Documentation
│   ├── ARCHITECTURE.md                 # This file
│   ├── CONTRIBUTING.md                 # Contribution guidelines
│   ├── SAFETY-FEATURES.md              # Safety mechanisms explained
│   ├── CONFIGURATION.md                # Config reference
│   ├── EXTENDING.md                    # Plugin/extension guide
│   └── TROUBLESHOOTING.md              # Common issues
│
├── examples/                           # Example configs & usage
│   ├── .autopilotrc.json.example       # Example repo config
│   ├── .autopilotignore.example        # Example ignore file
│   └── hooks/                          # Git hook examples (optional)
│
├── .github/
│   ├── workflows/                      # CI/CD pipelines
│   └── ISSUE_TEMPLATE/                 # Issue templates
│
├── .gitignore
├── .autopilotignore                    # Ignore for autopilot itself
├── LICENSE                             # MIT + Praise Masunga (PraiseTechzw)
├── package.json                        # ✓ Built by Praise Masunga
├── README.md                           # ✓ Built by Praise Masunga
└── CHANGELOG.md
```

---

## 2. FOLDER & FILE RESPONSIBILITIES

### `bin/autopilot.js`
- **Responsibility:** Executable wrapper, shebang line, minimal CLI bootstrap
- **No Logic:** Delegates to `src/cli/commands`
- **Usage:** `#!/usr/bin/env node`

### `src/cli/commands/`
- **Responsibility:** Command implementations (init, start, stop, status, doctor)
- **User Interaction:** Takes parsed args, produces output
- **Delegation:** Calls core business logic, handles command-specific validation

### `src/core/watcher.js`
- **Responsibility:** Orchestrates file system watching via chokidar
- **Not Responsible:** Git operations, commit decisions, debouncing logic
- **Single Concern:** Watch → emit events

### `src/core/commit-engine.js`
- **Responsibility:** Smart commit logic
- **Features:**
  - Analyze changed files → generate commit message
  - Apply conventional commit format
  - Respect commit message templates
  - Validate commit pre-conditions

### `src/core/branch-guard.js`
- **Responsibility:** Safety gates before actions
- **Checks:**
  - Protected branches (main, master)
  - Dirty working directory
  - Remote tracking status
  - Uncommitted dependencies
  - Large file detection

### `src/config/`
- **Responsibility:** All configuration loading, merging, validation
- **No Side Effects:** Pure functions
- **Schema Validation:** JSON Schema in `schema.json`
- **Hierarchy:** CLI args > env vars > .autopilotrc.json > defaults

### `src/daemon/`
- **Responsibility:** Process lifecycle, PID management, state persistence
- **Not Responsible:** Watching files or running git commands
- **Single Concern:** "Is the daemon running? Store/retrieve state."

### `src/safety/`
- **Responsibility:** All validation and safety checks
- **Pre-commit Checks:**
  - File size limits
  - Sensitive files detection (secrets, keys)
  - Conflict markers
  - Binary files

### `src/logger/`
- **Responsibility:** Structured logging with levels (debug, info, warn, error)
- **Output Formats:** Human-readable + JSON (for CI/CD integration)
- **No Business Logic:** Pure output formatting

### `src/utils/`
- **Responsibility:** Cross-cutting utilities (FS, paths, OS, retry, errors)
- **Reusable:** Used across all layers
- **No Dependencies:** Minimal, focused utilities

### `src/types/`
- **Responsibility:** JSDoc type definitions (since no TypeScript)
- **Purpose:** IDE autocomplete, documentation, safety
- **Format:** JSDoc `@typedef` in CommonJS

### `test/`
- **Unit Tests:** Pure functions, mocked dependencies
- **Integration Tests:** Real file system, controlled git repos
- **Fixtures:** Test data, sample configs

### `docs/`
- **ARCHITECTURE.md:** This design document
- **CONFIGURATION.md:** .autopilotrc.json schema reference
- **SAFETY-FEATURES.md:** All safety mechanisms explained
- **EXTENDING.md:** How to add custom hooks/plugins
- **TROUBLESHOOTING.md:** Common issues & solutions

---

## 3. DESIGN PRINCIPLES (10 CORE PRINCIPLES)

1. **Single Responsibility:** Each module does ONE thing well.
   - Commands ≠ Core Logic ≠ Config ≠ Daemon Management
   - Easy to test, replace, understand

2. **Separation of Concerns:** Clear layer boundaries.
   - CLI Layer (user interaction)
   - Core Layer (business logic)
   - Config Layer (configuration)
   - Daemon Layer (process management)
   - Safety Layer (validation)

3. **Configuration as Code:** All behavior driven by `.autopilotrc.json`
   - No hardcoded rules in source
   - Environment variable overrides supported
   - Validated against JSON Schema

4. **Fail-Safe by Default:**
   - Protected branches (main, master) → refuse auto-commit
   - Dirty state → abort silently (no data loss)
   - Large files → warn before committing
   - Conflicts → pause, alert user

5. **Defensive Git Execution:**
   - All git commands wrapped with error handling
   - Retry logic with exponential backoff
   - Graceful degradation (push fails → log, don't crash)
   - Pre-execution validation (branch exists, etc)

6. **No External Dependencies Beyond Essential:**
   - ✅ Keep: chokidar (battle-tested file watcher)
   - ✅ Keep: commander (mature CLI framework)
   - ✅ Keep: fs-extra (safe file operations)
   - ❌ Avoid: Heavy frameworks, large dependency trees

7. **Process Lifecycle Management:**
   - PID file for daemon tracking
   - Graceful shutdown (SIGINT, SIGTERM)
   - State persistence (what was last committed, etc)
   - Health checks (is daemon actually running?)

8. **Extensibility Without Bloat:**
   - Hook system for custom logic (pre-commit, post-push)
   - Plugin architecture for custom message generators
   - Custom ignore patterns support
   - Programmatic API via `src/index.js`

9. **Safety Before Speed:**
   - Debounce to avoid commit spam
   - Minimum time between commits
   - File size limits
   - Conflict detection
   - Branch protection
   - Dry-run mode support

10. **Maintainability & Testability:**
    - All business logic is pure functions (easy to test)
    - No global state (except intentional singletons: logger, config)
    - Dependency injection via function parameters
    - Comprehensive error messages (not cryptic)
    - Structured logging for debugging

---

## 4. KEY ARCHITECTURAL PATTERNS

### Pattern: Layered Architecture
```
CLI Layer (commands)
    ↓
Core Layer (business logic)
    ↓
Config Layer (loaded once, immutable)
    ↓
Utils Layer (pure functions)
```

### Pattern: Dependency Injection
```javascript
// Bad: Tight coupling
const watcher = new Watcher();

// Good: Inject dependencies
const watcher = new Watcher(config, logger, gitExecutor);
```

### Pattern: Error Boundary
```javascript
// All git operations wrapped
try {
  await gitExecutor.commit(message);
} catch (error) {
  logger.error(`Commit failed: ${error.message}`);
  // Graceful handling, not crash
}
```

### Pattern: Configuration Validation
```javascript
// Load → Validate → Use
const config = configLoader.load();
configValidator.validate(config); // Throws if invalid
const watcher = new Watcher(config); // Safe to use
```

---

## 5. COMMAND STRUCTURE EXAMPLE

```javascript
// src/cli/commands/start.js
async function start(options, config) {
  // 1. Validate environment
  validateGitRepo();
  config = configValidator.validate(config);
  
  // 2. Check daemon state
  const running = daemonManager.isRunning();
  if (running) throw new Error("Already running");
  
  // 3. Initialize core services
  const watcher = new Watcher(config, logger);
  const gitExecutor = new GitExecutor(logger);
  const commitEngine = new CommitEngine(config);
  
  // 4. Setup signal handlers
  signalHandler.onShutdown(async () => {
    await watcher.stop();
    daemonManager.clearPid();
  });
  
  // 5. Start watching
  await watcher.start();
  daemonManager.savePid(process.pid);
  
  // 6. Output result
  logger.info(`✓ Autopilot started (PID: ${process.pid})`);
}
```

---

## 6. CREDIT/SIGNATURE PLACEMENT

| Location | Signature |
|----------|-----------|
| `bin/autopilot.js` | First comment: `// Built by Praise Masunga (PraiseTechzw)` |
| `package.json` | `"author": "Praise Masunga (PraiseTechzw)"`, `"homepage": "https://github.com/praisetechzw/autopilot-cli"` |
| `README.md` | "**Built by Praise Masunga (PraiseTechzw)**" at top |
| `LICENSE` | "Copyright (c) 2026 Praise Masunga (PraiseTechzw)" |
| `src/index.js` | Header comment only (not in every file) |
| CLI Output | Version command: `autopilot@0.1.0 - Built by Praise Masunga (PraiseTechzw)` |

---

## 7. CONFIGURATION SCHEMA (.autopilotrc.json)

```json
{
  "version": "1.0",
  "watchDebounceMs": 2000,
  "minCommitIntervalSec": 60,
  "autoPush": false,
  "pushRetries": 3,
  "protectedBranches": ["main", "master", "develop"],
  "commitMessage": "chore: autopilot update",
  "commitMessageMode": "smart",
  "safety": {
    "checkLargeFiles": true,
    "maxFileSizeKb": 100,
    "detectSensitiveFiles": true,
    "checkForConflicts": true
  },
  "hooks": {
    "preCommit": null,
    "postCommit": null,
    "postPush": null
  }
}
```

---

## 8. IGNORE FILE FORMAT (.autopilotignore)

```
# Standard gitignore-like syntax
node_modules/
.git/
.env*
*.log
dist/
build/
coverage/

# Comments and blank lines ignored
# Glob patterns supported
**/.DS_Store
```

---

## 9. ROADMAP FOR EXTENSIBILITY

### Phase 1 (MVP)
- ✓ Core commands (init, start, stop, status)
- ✓ Basic safety checks
- ✓ Config validation

### Phase 2 (Hooks & Plugins)
- Pre-commit hooks (custom validation)
- Post-commit hooks (custom actions)
- Custom commit message generators

### Phase 3 (Advanced)
- Webhook integrations
- Slack notifications
- GitHub/GitLab API integration
- Conditional logic in config

---

## 10. TESTING STRATEGY

```
Unit Tests (80% coverage)
├── Config validation
├── Commit engine logic
├── Branch guard rules
├── Event debouncer timing
└── Safe file operations

Integration Tests (60% coverage)
├── Full watcher lifecycle
├── Daemon start/stop
├── Real git operations (test repo)
└── Signal handling

No E2E tests (too flaky with file watchers)
```

---

**Status:** Architecture Design Document (Pre-Implementation)  
**Version:** 1.0  
**Last Updated:** January 31, 2026  
**Architect:** Praise Masunga (PraiseTechzw)
