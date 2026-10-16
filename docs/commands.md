# CLI Reference

All commands run in the current repository unless stated otherwise. Use `autopilot <command> --help` for command-specific options.

| Command | Purpose |
| --- | --- |
| `autopilot init` | Create the repository configuration and ignore file. Existing files are preserved. |
| `autopilot start [--json]` | Run the file watcher in the foreground. |
| `autopilot stop` | Stop the active watcher. |
| `autopilot status [--json]` | Report watcher, branch, queue, and recent Git activity. |
| `autopilot pause [reason]` | Pause automated Git actions. |
| `autopilot resume` | Resume a paused watcher. |
| `autopilot undo [-c <count>]` | Undo recent Autopilot commits while keeping changes in the working tree. |
| `autopilot doctor [--json]` | Check Node, Git, configuration, AI setup, remote access, and watcher state. |
| `autopilot config list [--json]` | Print the effective configuration as JSON. |
| `autopilot config get <key> [--json]` | Read a configuration value; keys may use dot notation. |
| `autopilot config set <key> <value> [--global] [--json]` | Set a local or global configuration value. |
| `autopilot preset [list|apply] [name]` | List or apply a workflow preset. |
| `autopilot insights [-f text|json] [-e csv]` | View or export local productivity metrics. |
| `autopilot leaderboard [--sync]` | View leaderboard data or sync opted-in metrics. |
| `autopilot dashboard` | Open the interactive dashboard. |
| `autopilot guide` | Start the interactive usage guide. |
| `autopilot version [--json]` | Print CLI and runtime version information. |

## JSON and exit codes

JSON output is intended for integrations and should be written to stdout without surrounding prose. `doctor --json` exits with code `1` if any diagnostic fails. `status --json` exits with code `7` when there is no state file. Other stable codes are documented in the [extension contract](EXTENSION_CONTRACT.md#3-exit-codes).

## Configuration commands

Examples:

```sh
autopilot config list --json
autopilot config get ai.enabled --json
autopilot config set autoPush false
autopilot config set debounceSeconds 30 --global
```
