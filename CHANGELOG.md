## v0.1.1 – Package Hygiene

### Fixed
- Resolved npm publish warnings by adding `files` whitelist
- Renamed package to scoped `@praisetechzw/autopilot`
- Excluded unnecessary development files from distribution

## v0.1.0 – Initial Release

### Added
- Intelligent auto commit & push
- Branch protection (main/master blocked)
- Remote-ahead safety checks
- Smart conventional commit messages
- Per-repo config and ignore rules

Built by Praise Masunga (PraiseTechzw).
# Changelog

All notable changes to this project will be documented in this file.
This project follows Semantic Versioning (https://semver.org).

---

## [0.1.4] – 2026-02-01

### Fixed
- **Windows Compatibility**: Fixed critical issue where absolute paths on Windows caused ignore rules to fail.
- **Watcher Noise**: Fixed infinite commit loops caused by `.vscode/time-analytics.json` and self-logging.
- Fixed a critical CLI crash where `autopilot start` failed due to miswired Commander action handlers.
- Improved command registration to ensure all CLI commands are correctly bound and validated at runtime.
- Prevented undefined command handlers from causing runtime exceptions.

### Added
- **Release Gates**: Added `npm run verify` and `prepublishOnly` hooks to prevent broken releases.
- **Integration Tests**: Added full end-to-end test suite using `node:test`.
- **Smart Init**: `autopilot init` now automatically adds `autopilot.log` to `.gitignore`.
- Pre-publish verification pipeline to block publishing broken builds.
- CLI smoke tests to ensure core commands (`init`, `start`, `status`, `doctor`) do not crash.
- Test-only dry-run mode for watcher to allow safe automated testing.
- Additional configuration and commit logic unit tests.

### Changed
- Standardized command exports across all CLI commands.
- Improved error messages for misconfigured or invalid commands.
- Strengthened release hygiene and stability guarantees.

### Developer Experience
- Added `prepublishOnly` guard to prevent accidental publishing of failing builds.
- Improved Windows compatibility during testing and CLI execution.

---

## [0.1.3] – 2026-01-31

### Added
- Initial public release of Autopilot CLI.
- Intelligent Git automation with smart commit messages.
- Background watcher with debouncing and safety rails.
- Branch protection and remote-ahead detection.
- `doctor` command for environment diagnostics.
- Per-project configuration via `.autopilotrc.json`.

---

## [0.1.0] – Initial Development
- Core architecture and foundational CLI commands.
