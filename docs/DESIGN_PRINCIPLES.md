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

## Privacy & Local-First Design

**Privacy Guarantees:**
- Your source code **never** leaves your machine
- No code diffs are transmitted externally
- No file contents are sent to remote servers
- AI commit message generation happens with metadata only (file paths, line counts, not actual code)

**Local-First Architecture:**
- Works 100% offline (except for git push operations)
- No authentication to external services required
- All data stored locally in your project
- Configuration is local and version-controllable

## Leaderboard & Metrics

- Metrics are derived **only** from local Git activity created by Autopilot.
- **No raw code, diffs, or file contents are ever transmitted.**
- Leaderboard data is:
  - opt-in (disabled by default)
  - anonymized or pseudonymous
  - explainable (users know exactly what is counted)
  - aggregate only (commit counts, focus time, streak days)

**What gets synced (if opted in):**
- ✅ Commit counts
- ✅ Focus time duration
- ✅ Streak days
- ✅ Anonymized username/identifier

**What never gets synced:**
- ❌ Source code
- ❌ File names or paths
- ❌ Commit messages
- ❌ Repository names
- ❌ File diffs or changes

## User Experience Philosophy

**When in Doubt: Pause, Explain, Wait**

- Ambiguous situations should trigger clear, actionable error messages
- Users should always understand what Autopilot is doing and why
- Status messages should be informative without being verbose
- Configuration should have sensible defaults but be fully customizable

**Trust Through Transparency:**
- Every action Autopilot takes should be logged
- Users should be able to audit what happened and when
- The system should explain its decisions in plain language
- Documentation should be honest about limitations

## Development Guidelines

**For Contributors:**
- Any feature must pass the "trust test" - would you trust this with your production code?
- Prefer explicit over implicit behavior
- Add clear error messages for every failure case
- Document why, not just what
- Test edge cases extensively, especially around git state

**For AI Integration:**
- AI should enhance, not replace, developer judgment
- All AI suggestions must be reviewable before commit
- Provide escape hatches for AI-generated content
- Log AI usage for transparency
- Allow disabling AI features entirely

---

*Any feature (including Grok or leaderboards) must pass this test: Does it maintain developer trust, safety, and control?*

