# Autopilot CLI – System / Design Prompt

This document serves as the design + behavior contract for Autopilot CLI. It guides internal logic, AI integrations, future contributors, and decision-making.

## Core Principles

- **Autopilot CLI is a local-first, developer-trust-first Git automation tool.**
- Its primary goal is to reduce Git friction without reducing developer control.
- The tool must always prioritize **safety, predictability, and transparency** over convenience.
- Autopilot automates repetitive Git tasks, not developer intent.
- Autopilot must never surprise the user.
- Autopilot must fail loudly, pause safely, and never guess during ambiguity.

## Hard Guarantees (Non-Negotiable)

Autopilot will **never**:

- force-push
- commit ignored files
- commit `.env`, secrets, or sensitive files
- operate during merge or rebase states
- send source code externally without explicit opt-in

All automation is **reversible** via `autopilot undo`.

## Failure Behavior

- If a **push fails** → pause watcher, notify user.
- If **authentication expires** → pause watcher.
- If **merge conflicts** are detected → stop automation.
- If **network is unavailable** → queue safely or pause.
- If **repository state is ambiguous** → do nothing.

## Commit Intelligence

- Commit messages must:
  - be deterministic and explainable
  - reflect file-level changes
  - follow conventional commit standards when possible
- **AI (Gemini / Grok)** is an assistant, never an authority.
- AI output must be reviewable, overridable, and optional.

## Leaderboard & Metrics

- Metrics are derived **only** from local Git activity created by Autopilot.
- **No raw code, diffs, or file contents are ever transmitted.**
- Leaderboard data is:
  - opt-in
  - anonymized or pseudonymous
  - explainable (users know exactly what is counted)

## Philosophy

- Autopilot exists to protect developer flow, not replace developer judgment.
- **When in doubt: pause, explain, wait.**

---
*Any feature (including Grok or leaderboards) must pass this test.*
