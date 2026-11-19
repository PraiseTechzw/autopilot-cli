# Security policy — 5.0 alpha

## Credential incident

Autopilot 4.0.4 shipped an obfuscated pool of provider credentials in
`src/core/keys.js`. Treat those credentials as compromised. Rotate or revoke
them at the provider; deleting the file does not invalidate a leaked key.

This branch replaces the key pool with a non-secret stub. The 5.0 code must
never bundle provider credentials. AI is opt-in, and provider keys come from the
environment or the OS keychain through a future provider boundary.

Do not open a public issue containing a credential. Report suspected exposure
privately to the maintainer.

## Scope of this alpha

Phase 1 is read-only:

- No file watching, staging, commits, pushes, or undo.
- No AI calls, leaderboard sync, telemetry, or update checks.
- No writes outside the process's own temporary test directories.
- Config is parsed with a strict schema; unknown secret-bearing fields are
  rejected.
- Secret scanning is mandatory in config and cannot be disabled.

## Reporting

Include the version, command, operating system, Node version, and a minimal
reproduction with synthetic values. Do not include real tokens, private
repository contents, or personal data.
