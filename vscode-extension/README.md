# Autopilot for VS Code

The Autopilot VS Code extension provides a live sidebar for the Autopilot CLI. It exposes watcher status, current branch, pending changes, integrated command output, quick actions, and a form-based editor for `.autopilotrc.json`.

## Development

Open the repository in VS Code, press `F5`, and select **Extension Development Host**. The extension prefers `bin/autopilot.js` from the opened workspace when available. Set `autopilot.cliPath` to an installed `autopilot` executable when using the extension with another repository.

## Features

The Autopilot activity-bar view refreshes repository status automatically and provides buttons for starting, stopping, pausing, resuming, undoing the last commit, refreshing, and opening settings. Command output is written to the **Autopilot** output channel and failures appear as VS Code error notifications.

The sidebar also reads the CLI’s Supabase-backed telemetry export and shows the rolling five-minute event count, event rate, latest event data, and telemetry stream state. Configure `autopilot.telemetryAlertsEnabled`, `autopilot.telemetryEventsPerMinute`, and `autopilot.telemetryTotalEvents` to control threshold warnings. If Supabase is unavailable, the sidebar shows the actual error instead of displaying synthetic metrics.

The settings editor reads and writes `.autopilotrc.json` in the active workspace. The supported form fields are debounce delay, auto push, team mode, desktop notifications, and commit cooldown. The extension does not embed API keys or credentials.

## Configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `autopilot.cliPath` | `autopilot` | CLI command or absolute executable path. |
| `autopilot.useWorkspaceCli` | `true` | Prefer the workspace `bin/autopilot.js` when it exists. |
| `autopilot.refreshIntervalMs` | `5000` | Sidebar refresh interval, with a one-second minimum. |
| `autopilot.telemetryAlertsEnabled` | `true` | Enable telemetry threshold warnings. |
| `autopilot.telemetryEventsPerMinute` | `20` | Alert above this event rate. |
| `autopilot.telemetryTotalEvents` | `100` | Alert above this five-minute event count. |
