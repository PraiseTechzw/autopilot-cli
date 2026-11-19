# Autopilot 5.0 — v5 package

**Status: Phase 1 skeleton (alpha). Not published. Not feature-complete.**

This directory is the new TypeScript implementation. The v4 CommonJS tree at
the repository root is frozen for reference during migration and is not the
5.0 runtime.

## What works today

- `autopilot-v5 version` / `version --json`
- `autopilot-v5 doctor` / `doctor --json`
- `autopilot-v5 status` / `status --json`
- `autopilot-v5 config validate` / `config validate --json`
- Strict v5 config schema with safe defaults
- JSON output contract: one document on stdout, logs and errors on stderr
- Read-only Git adapter using argument arrays, never a shell
- Detached HEAD and merge/rebase/cherry-pick/revert/bisect detection

## What does not exist yet

File watching, staging, secret scanning, commits, pushes, undo, migration from
v4, the control plane, AI providers, dashboard, insights, leaderboard,
telemetry, notifications, and the VS Code contract. Do not use this alpha as a
replacement for v4.

## Safety defaults

A missing config is valid and uses these defaults:

```json
{
  "version": 5,
  "watch": { "debounceMs": 1000, "maxWaitMs": 30000 },
  "git": {
    "autoPush": false,
    "remote": "origin",
    "protectedBranches": ["main", "master"]
  },
  "safety": {
    "secrets": "block",
    "maxFileSizeMb": 10,
    "scanStagedBlobsOnly": true
  },
  "ai": { "enabled": false, "provider": "none" },
  "privacy": {
    "leaderboard": false,
    "telemetry": false,
    "updateCheck": false
  }
}
```

Rules enforced by the schema:

- Unknown keys are rejected, including `apiKey` and similar secret fields.
- `safety.secrets` is `block` only; `warn` and `off` are rejected while the
  scanner is being built. Scanning is mandatory.
- AI cannot be enabled without a provider.
- AI/leaderboard/telemetry/update checks are off by default.
- No network request is made by any current command.

## Requirements

- Node.js >= 22
- Git on `PATH`

## Development

```sh
cd v5
npm ci
npm test
node dist/src/cli.js --help
```

`npm test` cleans, compiles with TypeScript strict mode, and runs the Node test
runner. Tests use temporary repositories and never touch the caller's repo.

## Layout

```text
src/
  cli.ts                 command wiring and exit codes
  commands/              command handlers and output
  core/
    config/              strict schema and loader
    git/                 read-only Git adapter
    doctor.ts            environment checks
    status.ts            repository/config status
    errors.ts            typed application errors
    output.ts            JSON and human output contract
    result.ts            Result<T, E>
test/                    unit and CLI integration tests
```

## Next phases

1. Policy and scanner in shadow mode (allowlist staging, staged-blob scan).
2. Journaled commit and safe undo.
3. Watcher and control plane.
4. Fast-forward-only push guard.
5. Opt-in AI boundary.
6. Optional surfaces and release hardening.

The architecture and migration plan are in the Stage 1 audit. This package does
not claim any phase beyond Phase 1.
