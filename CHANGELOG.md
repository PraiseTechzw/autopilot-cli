# Changelog

All notable changes to this project will be documented in this file.
This project follows [Semantic Versioning](https://semver.org).

## [2.1.0] - 2026-02-08

### Added
- **Global Configuration**:
  - Added support for global config via `~/.autopilot/config.json`.
  - Added `--global` flag to `autopilot config` command.
  - Implemented config merging (Local > Global > Defaults).
- **xAI Grok Integration**:
  - Added Grok as a supported AI provider for commit message generation.
  - Configurable via `ai.provider: 'grok'` and `grokApiKey`.
- **Safety**:
  - Watcher now automatically pauses on push failures to prevent error loops.
  - Added "Push Failed" state to StateManager.
- **Leaderboard**:
  - Implemented accurate focus time calculation by parsing `autopilot.log`.
  - Fallback to git stats for proxy metrics if logs are missing.

### Fixed
- **Test Suite**: Resolved cross-test contamination in config tests and watcher integration tests.
- **Windows Compatibility**: Fixed issues with `process.cwd()` mocking in tests on Windows.

## [2.0.1] - 2026-02-05

### Fixed
- **Dashboard Stability**: Fixed a crash in `autopilot dashboard` caused by incorrect named import of `getRunningPid`.
- **Command Reliability**: Added regression tests for `dashboard`, `pause`, `resume`, `stop`, and `status` commands to ensure stability.

## [2.0.0] - 2026-02-04

### Added
- **Safety System (Phase 1)**:
  - **Undo/Rollback**: `autopilot undo` command to safely revert the last autopilot commit.
  - **Team Mode**: Enhanced `autopilot init` with team configuration. Implements "Pull-Before-Push" to prevent conflicts.
  - **Pre-Commit Validation**:
    - **Secret Detection**: Blocks commits containing AWS, GitHub, or Stripe keys.
    - **File Size Check**: Prevents committing files larger than 50MB.
    - **Quality Gates**: Optional linting and test execution before commit.
  - **Pause/Resume**: `autopilot pause` and `autopilot resume` for manual control of the automation loop.
- **Visibility & UX (Phase 2)**:
  - **Real-Time Dashboard**: `autopilot dashboard` providing a live view of file changes, last commit status, and system health.
  - **Enhanced Insights**: `autopilot insights` with deep analytics:
    - Commit Quality Score (0-100) based on conventional commit standards.
    - Productivity metrics (peak hours, streaks).
    - CSV export capability (`--export csv`).
- **Intelligence (Phase 3)**:
  - **AI Commit Messages**: Integration with Google Gemini for context-aware, senior-level commit message generation.
  - **Workflow Presets**: `autopilot preset` command to quickly switch between workflows:
    - `safe-team`: Optimized for collaboration (Team Mode + Secret Checks).
    - `solo-speed`: Optimized for rapid individual development.
    - `strict-ci`: Enforces testing and linting before every commit.
### Docs/Website
- Added Leaderboard page with live simulated rankings.
- Updated homepage Feature Showcase to demonstrate Insights and Safety & Team features.
- Added Leaderboard to top navigation.
- Updated Introduction docs to highlight v2.0 features (AI, Focus Engine, Team Mode, Safety Net).

## [0.1.8] - 2026-02-04

### Reliability & Core
- **Watcher Engine Overhaul**:
  - Implemented dual ignore checks (chokidar + internal matcher) to guarantee no ignored files trigger builds.
  - Added "Max Wait" fallback (60s) to prevent debounce starvation on busy repos.
  - Hardcoded critical ignores (`.git`, `node_modules`, `autopilot.log`) to prevent infinite loops.
- **Git Safety**:
  - Added graceful fallback for push failures (logs warning instead of crashing).
  - Enforced "tracked only" commits using `git status --porcelain`.
- **Test Mode**:
  - Added `AUTOPILOT_TEST_MODE=1` flag for deterministic CI testing (foreground run + auto-exit).

### CI/CD & Standards
- **GitHub Workflows**:
  - `ci.yml`: Automated testing on Windows, Ubuntu, and macOS for every PR.
  - `release.yml`: Automated GitHub Releases with changelog generation and tarball assets.
  - `publish.yml`: Secure npm publishing via OIDC provenance.
- **Repository Standards**:
  - Added Issue Templates (Bug/Feature), PR Template, `SECURITY.md`, and `CODEOWNERS`.

### Fixed
- **Windows Paths**: Fixed path normalization issues causing ignore rules to fail on Windows.
- **Self-Triggering**: Fixed issue where writing `autopilot.log` could trigger a new commit loop.

## [0.1.7] - 2026-02-01

### Added
- **CLI Update Notifier**:
  - Automatically checks for new versions on npm registry (once every 24 hours).
  - Zero-dependency implementation using native Node.js `https`.
  - Non-intrusive visual notification box on startup when updates are available.
- **Documentation**:
  - Added live NPM download statistics to landing page and documentation sidebar.
  - Enhanced install command widget with one-click copy.

## [0.1.6] - 2026-02-01

### Added
- **Smart Commit Generator 2.0**:
  - Offline diff parsing using `git diff` (no external APIs).
  - Conventional Commits compliance (`feat`, `fix`, `docs`, `style`, `test`).
  - Intelligent scope detection for UI, Theme, Search, and Docs.
  - Golden Test Suite with 10 fixtures for guaranteed message quality.
- **Developer Experience**:
  - Added `npm run verify` script for pre-release checks.
  - Improved Windows path normalization for reliable cross-platform usage.

### Changed
- **Performance**: Switched from file-based status checks to staged diff analysis for commit messages.
- **Logic**: Reordered commit type priority (Style > Src > Test > Docs) to prevent misclassification of mixed changes.
- **Fix**: Resolved issue where new files were incorrectly flagged as `fix` instead of `feat`.

## [0.1.4] - 2026-02-01

### Fixed
- **Windows Compatibility**: Fixed critical issue where absolute paths on Windows caused ignore rules to fail.
- **Watcher Noise**: Fixed infinite commit loops caused by `.vscode/time-analytics.json` and self-logging.
- **CLI Crash**: Resolved `autopilot start` failure due to miswired Commander action handlers.

### Added
- **Release Gates**: Added `npm run verify` and `prepublishOnly` hooks to prevent broken releases.
- **Integration Tests**: Added full end-to-end test suite using `node:test`.
- **Smart Init**: `autopilot init` now automatically adds `autopilot.log` to `.gitignore`.
- **Diagnostics**: Added `autopilot doctor` for environment health checks.

## [0.1.3] - 2026-01-31

### Added
- **Initial Public Release**: First stable release on npm as `@traisetech/autopilot`.
- **Core Features**:
  - Intelligent auto commit & push.
  - Background watcher with debouncing.
  - Branch protection (blocks commits to `main`/`master` by default).
  - Remote-ahead safety checks.
  - Per-project configuration via `.autopilotrc.json`.

## [0.1.1]

### Changed
- **Package Hygiene**: Renamed package scope.
- **Distribution**: Added `files` whitelist to `package.json` to reduce install size.

## [0.1.0]

### Added
- **Prototype**: Initial development release with core architecture.
