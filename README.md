# Autopilot

Autopilot is a production-ready Python CLI for bounded, inspectable AI-assisted software development. **v1.0.0 is the first stable release.**

## Development setup

```bash
cd autopilot
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e '.[test]'
pytest
```

## CLI

```bash
autopilot --help
python -m autopilot --help
autopilot status
autopilot git status
autopilot analyze
autopilot test
autopilot scan
autopilot checkpoint --label before-change
autopilot commit-message
autopilot review
autopilot remember architecture "Services communicate over HTTP."
autopilot memory
```

The first milestone focuses on a dependency-light CLI and Git engine. Git operations are executed through `subprocess` with explicit argument lists, captured output, and structured errors; no shell interpolation is used.

The local safety layer also includes deterministic project analysis, test-command discovery, likely-secret scanning, and Git checkpoints with an append-only flight recorder.

GitHub and AI features are provider-neutral adapters: the GitHub client performs only an explicitly requested API operation, while commit-message and review commands use deterministic local fallbacks until an AI provider is configured.

## Real AI provider

Set `OPENROUTER_API_KEY` to enable the real provider. The default model is `openrouter/free`, OpenRouter's free-model router. Free-model availability and rate limits can change, so the selected model is intentionally configurable. You can select another OpenAI-compatible gateway with `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.

```bash
export OPENROUTER_API_KEY="..."
export AI_MODEL="openrouter/free"       # or a specific provider model with a :free variant
autopilot commit-message --path .
autopilot review --path .
autopilot commit --ai --allow-medium --path .
autopilot github branch feature/auth --allow-high
autopilot github pr-create --owner acme --repo demo --head feature/auth --base main --allow-high
autopilot github ci-status --owner acme --repo demo --branch feature/auth
autopilot resume
autopilot watch --iterations 3 --interval 10
autopilot replay
autopilot ci-analyze --owner acme --repo demo --run-id 123
autopilot workflow --owner acme --repo demo --allow-medium --allow-high
```

AI requests are read-only, include project-analyzer and project-memory context, redact obvious credentials before transmission, and retain local safety findings. AI does not modify files or execute Git operations. The `commit` workflow requires `--allow-medium`, blocks HIGH review findings, and commits only already-staged changes by default.

The provider follows OpenRouter's documented OpenAI-compatible `POST /api/v1/chat/completions` interface. See [OpenRouter Quickstart](https://openrouter.ai/docs/quickstart) and the [Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free).

Project decisions are stored locally in `.autopilot/memory.json`; checkpoints and events are stored under `.autopilot/` for inspectability and undo-oriented workflows.

## GitHub workflows

Set `GITHUB_TOKEN` to use the GitHub REST adapter. Branch pushes and pull-request creation are high-risk external actions and require `--allow-high`; failures are reported without retrying or silently continuing. PR summaries use the configured AI provider when `--ai` is selected and otherwise use a deterministic summary. CI status is read-only and reports the latest GitHub Actions workflow runs.

The GitHub commands are:

- `autopilot github branch NAME --owner OWNER --repo REPO --allow-high`
- `autopilot github pr-create --owner OWNER --repo REPO --head BRANCH --base main --allow-high`
- `autopilot github ci-status --owner OWNER --repo REPO --branch BRANCH`

## Autonomous workflow and recovery

`autopilot resume` reconstructs the repository profile, current branch/HEAD, working-tree changes, project memory, and recent audit events. `autopilot replay` prints audit events only; replay never re-executes side effects. `autopilot watch` is intentionally bounded by `--iterations` and does not create a hidden daemon.

`autopilot ci-analyze` downloads logs for a completed failed workflow, extracts likely error lines and source files, redacts obvious secrets, and optionally asks the configured AI provider for a diagnosis. It never edits code or reruns CI automatically.

`autopilot workflow` runs context recovery, staged-diff review, tests, a permission-gated commit, and a permission-gated PR. Add `--push` to publish the branch; pushing requires the existing high-risk gate. A HIGH review finding or failed tests blocks the workflow. CI monitoring remains read-only after PR creation.

## Production onboarding

Start with the read-only diagnostics command:

```bash
autopilot doctor
autopilot config init
autopilot config show
autopilot analyze
autopilot changes --staged
autopilot verify
autopilot memory authentication
autopilot plan "fix authentication and ship a PR"
autopilot iterate --max-iterations 3
autopilot propose-fix --owner OWNER --repo REPO --run-id 123 --ai
autopilot apply-fix reviewed.patch --approve --allow-medium
autopilot debug --ai --allow-medium --max-iterations 3
autopilot execute-task "change the authentication timeout" --ai --approve --allow-medium --max-iterations 3
```

Configuration precedence is **defaults → user config → project config → environment variables**. User config lives at `$XDG_CONFIG_HOME/autopilot/config.toml` on Unix-like systems or `%APPDATA%\\autopilot\\config.toml` on Windows. Project config lives at `.autopilot/config.toml`. API keys are never written by `config init` or displayed by `config show`.

For systems where another program already owns the `dot` executable name, use the unambiguous entry point:

```bash
autopilot-dot resume
autopilot-dot workflow --owner OWNER --repo REPO --allow-medium --allow-high
```

`autopilot events` displays structured local observability events. External tokens and token-like values are redacted before they are persisted. Git and subprocess operations have bounded timeouts and normalized errors.

For CI and scripts, prefer `autopilot status --json`, `autopilot verify`, and exit codes over parsing human-readable output. The stable package also provides `autopilot-cli`, `autopilot-dot`, and `python -m autopilot` entry points.

## Intelligence and verification

Project analysis now records architecture areas, likely entrypoints, dependency names, conventions, CI systems, and test frameworks. `autopilot changes` groups staged or working-tree changes by logical area and assigns a conservative risk label. `autopilot verify` runs secret scanning and tests, then uses installed lint/type tools when detected; required checks block the workflow while optional quality checks are reported.

Project memory is timestamped, deduplicated, source-labelled, and searchable. AI prompts use relevant memory instead of blindly sending the entire memory store, include the project map and change summary, and remain bounded before secret redaction and provider transmission.

## Controlled autonomy

`autopilot plan` creates a bounded plan with explicit risk levels and approval requirements. Allowed actions are limited to inspect, propose, verify, commit, push, and PR; arbitrary shell commands are never accepted as plan steps.

`autopilot iterate` repeats required verification only up to the requested limit. It does not edit files or apply AI suggestions. `autopilot propose-fix` diagnoses a failed CI run and produces a reviewable proposal with a patch, rationale, affected files, and risk; proposals are recorded as **not applied**.

The end-to-end workflow accepts `--max-iterations` and uses the same controlled verifier before any commit, push, or PR action. Every autonomous approval creates a checkpoint and an audit event. CI diagnoses include category, confidence, likely files, and a safe reproduction hint.

## Controlled coding agent

`autopilot apply-fix` accepts only text unified diffs. It rejects binary patches, absolute paths, traversal paths, `.git`/`.autopilot` paths, undeclared files, and secret-like assignments. It runs `git apply --check`, creates a checkpoint, applies the patch, rescans for secrets, and reverses the patch if safety validation fails.

AI patches require both an explicit `--approve` and the matching risk permission (`--allow-medium` or `--allow-high`). Every attempt and application is recorded without storing patch contents in the audit log.

`autopilot debug --ai` runs a bounded test-driven loop. It asks the configured provider for a minimal reviewable patch when required verification fails, applies it only with explicit permission, reruns verification, and automatically rolls back patches that do not make the required checks pass. It stops on success, an unsafe proposal, a missing proposal, or the iteration limit.

## End-to-end task execution

`autopilot execute-task` requires a clean repository, builds a bounded codebase context from architecture, entrypoints, dependencies, important files, relevant memory, and task-related files, then asks the provider for a multi-file unified patch. The patch is applied through the same checkpointed, secret-scanned, reversible patch engine. Required verification runs immediately; if it fails, bounded debugging proposals may be attempted. Add `--commit` only when the verified task should be committed; commit still requires `--approve` and the medium-risk permission gate.
