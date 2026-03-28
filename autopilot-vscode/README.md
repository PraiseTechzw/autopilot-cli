# Autopilot for VS Code

> Intelligent git automation — a GUI shell over the [autopilot-cli](https://github.com/PraiseTechzw/autopilot-cli).

![Status bar](media/icon.svg)

## Features

- **Sidebar panel** — live tree view of autopilot status, branch, last commit/push, queue
- **Status bar item** — one glance at autopilot health; click to start/stop/pause
- **Settings panel** — edit `.autopilotrc.json` visually with form UI
- **Log viewer** — live-streaming, color-coded autopilot output
- **Toast notifications** — conflict alerts, push success/failure, process exit
- **All commands** available in the Command Palette

## Requirements

The autopilot CLI must be installed globally:

```bash
npm install -g autopilot-cli
```

## Getting Started

1. Open a workspace that contains `.autopilotrc.json`
2. The extension activates automatically
3. Click `$(eye) Autopilot` in the status bar or open the Autopilot sidebar

## Commands

| Command | Description |
|---------|-------------|
| `Autopilot: Start` | Start the autopilot watcher |
| `Autopilot: Stop` | Stop the autopilot watcher |
| `Autopilot: Pause` | Pause watching temporarily |
| `Autopilot: Resume` | Resume watching |
| `Autopilot: Undo last commit` | Git reset the last auto-commit |
| `Autopilot: Open settings` | Open the settings webview |
| `Autopilot: Open output log` | View live streaming log |
| `Autopilot: Run doctor` | Diagnose autopilot health |
| `Autopilot: Show status` | Print current status to output |
| `Autopilot: Initialize` | Run `autopilot init` in workspace |

## Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `autopilot.cliPath` | `autopilot` | Path to CLI binary if not in PATH |
| `autopilot.pollInterval` | `2000` | ms between state file polls |
| `autopilot.showNotifications` | `true` | Enable toast notifications |

## Architecture

This extension is a **pure GUI shell** — it never re-implements git logic.

```
CLI process (autopilot start)     VS Code Extension
    │                                    │
    ├─ writes .autopilot-state.json ───► StateReader polls every 2s
    ├─ writes .autopilot.log ─────────► LogPanel streams
    │                                    │
    └─ listens for SIGTERM ◄──────────── cliRunner.stop()
```

## License

MIT
