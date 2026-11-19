# ADR 0001 — 5.0 foundation

**Status:** accepted  
**Date:** 2026-11-19  
**Deciders:** product owner (approved the Stage 1 recommendations)

## Context

Autopilot 4.0.4 is a JavaScript/CommonJS CLI with unsafe staging, bypassable
secret scanning, privacy-unsafe defaults, unsafe push/undo behavior, PID-based
process control, and embedded provider credentials. The tests pass but do not
cover those paths.

The GitHub `main` branch is a Python package (`autopilot-dev` 1.1.0), not the
JavaScript product. The JavaScript source of truth is tag `v4.0.4`
(`0eead70f3f83627e829af632ee94c03a1d8f4360`).

## Decisions

1. **Branch from the product, not `main`.** Create `v5` from tag `v4.0.4`.
   Preserve the Python work as a separately named legacy branch/tag upstream.
2. **TypeScript modular monolith.** Strict TypeScript, explicit layers, no
   framework rewrite.
3. **Node >= 22.** Matches the dependency floor and the supported LTS line.
4. **Local commits only by default.** `git.autoPush` is false until explicit
   opt-in.
5. **AI is off by default.** No bundled credentials. A provider key comes from
   the environment or OS keychain, never the repository config.
6. **Leaderboard and telemetry are optional surfaces.** Disabled by default and
   absent from the core execution path.
7. **Ship a 4.0.5 security patch if users exist**, then 5.0. Do not publish from
   this branch without a release review.
8. **Single package first.** Optional surfaces load lazily; split packages only
   when the boundary is proven.

## Consequences

- The v4 tree remains at the repository root during migration. The new package
  lives in `v5/` so both can be inspected and tested side by side.
- The v4 embedded key pool is replaced by a non-secret stub on this branch. The
  credentials must still be revoked at the provider; deleting the file is not
  incident response.
- No v5 command may claim a capability that is not implemented. `status`
  reports that the control plane is unavailable rather than pretending a
  watcher is stopped.
- Phase 1 is read-only: no staging, commits, pushes, network calls, or writes
  outside test temporary directories.
- A future promotion step will move `v5/` to the repository root and archive
  the v4 tree. That move is deliberately not part of Phase 1.

## Phase 1 exit criteria

- `version`, `doctor`, `status`, and `config validate` pass contract tests.
- JSON mode emits exactly one document on stdout.
- Safe defaults are enforced by a strict schema.
- Read-only Git adapter handles ordinary, detached-HEAD, and in-progress
  operation states.
- Tests run on the Node 22/24 line; no network access is required.
