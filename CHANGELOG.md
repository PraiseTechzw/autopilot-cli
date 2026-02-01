# Changelog

All notable changes to this project will be documented in this file.
This project follows [Semantic Versioning](https://semver.org).

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
