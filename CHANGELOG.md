# Changelog

## 1.0.0 — Stable

Autopilot 1.0.0 is the first stable release of the bounded AI development agent.

### Stable capabilities

- Project analysis with architecture, dependencies, entrypoints, conventions, tests, and CI detection
- Searchable project memory with timestamps, sources, deduplication, and relevance ranking
- Secret scanning and AI prompt redaction
- Checkpoints, flight recorder events, replay, structured observability, and patch recovery
- Permission-gated commits, pushes, pull requests, and AI patch application
- Unified patch validation with path traversal, binary patch, and secret-like assignment rejection
- Bounded task planning, multi-file task execution, iterative verification, and test-driven debugging
- CI failure categorization, log analysis, reproduction guidance, and reviewable fix proposals
- Cross-platform configuration, diagnostics, `python -m autopilot`, `autopilot-cli`, and `autopilot-dot` entry points
- Mocked GitHub integration coverage and end-to-end task execution tests

### Safety contract

Autopilot never treats an AI response as authorization. Code changes require an explicit approval flag and matching risk permission, pass through a checkpoint and validation layer, are rescanned for secrets, and can be reversed with `autopilot undo`. Iterative execution is bounded and records each attempt.

### Verification

The release is produced only after the full pytest suite, Python compilation, CLI smoke tests, package installation, and archive validation pass.
