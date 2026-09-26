# Autopilot Developer Agent for VS Code

A thin VS Code UI over the **Autopilot Python CLI**. The extension does not reimplement project analysis, Git, AI providers, security scanning, checkpoints, permissions, or workflow logic. It invokes the installed CLI and renders structured results.

## Requirements

- VS Code 1.85 or newer
- Autopilot CLI 1.0.0 or newer installed and available as `autopilot`
- A Git repository opened as the VS Code workspace
- Configure `OPENROUTER_API_KEY`/`AI_API_KEY` only when provider-backed AI actions are needed

## Install locally

1. Build the Python project and install Autopilot (`python -m pip install -e .`).
2. From this directory run `npm install` and `npm run package`.
3. In VS Code use **Extensions: Install from VSIX...** and select the generated `autopilot-dev-1.0.0.vsix`.
4. Open a Git repository and select the Autopilot icon in the Activity Bar.

Set `autopilot.command` when the CLI is not on PATH. Use **Autopilot: Configure** to open extension settings.

## Safety model

The extension never bypasses CLI gates. High-risk actions still require explicit Autopilot flags, patch application still requires approval and risk authorization, and the Python core remains responsible for checkpoints, secret scanning, audit events, rollback, and provider authentication. A failed or missing CLI is shown as a recoverable dashboard error rather than silently falling back to local TypeScript logic.

## Development

```bash
npm install
npm test
npm run package
```

The automated tests cover command construction, JSON parsing, version compatibility, error mapping, and dashboard HTML/message behavior without requiring a running VS Code host.
