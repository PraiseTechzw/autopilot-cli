# TROUBLESHOOTING

## Common Issues

### Watcher Loop / High CPU Usage (Windows)
If Autopilot seems to be constantly triggering or consuming high CPU on Windows, it is likely due to "noisy" files that change frequently but should be ignored.

**Common Culprits:**
- `.vscode/time-analytics.json`: Some VS Code extensions write to this file constantly.
- `autopilot.log`: If the watcher logs to a file that it is also watching, it creates a feedback loop.

**Solution:**
Autopilot v0.1.4+ includes enhanced Windows path handling to automatically ignore these files. If you still see issues:
1. Ensure `.vscode/` and `*.log` are in your `.autopilotignore` file.
2. Run `autopilot doctor` to verify your configuration.

### "git.status is not a function"
This was a known issue in older versions. Please upgrade to the latest version.

### Permissions Errors
Ensure you have write access to the repository and that no other process has locked the files (common on Windows with anti-virus software).
