# 👥 Team Mode

Autopilot V2 introduces **Team Mode**, designed to make automated Git workflows safe and efficient for collaborative environments.

## How it Works

When `teamMode` is enabled in your configuration, Autopilot changes its behavior to prioritize synchronization and conflict prevention.

### Key Behaviors

1. **Pull-Before-Push**:
   Before attempting to push any local commits, Autopilot automatically runs `git pull --rebase`. This ensures your local branch is up-to-date with the remote, minimizing merge conflicts.

2. **Conflict Abortion**:
   If a pull operation detects conflicts, Autopilot **immediately aborts** the automation loop. It will not attempt to commit or push until you manually resolve the conflicts.
   - **Status**: The watcher enters a "Stopped" or error state.
   - **Notification**: You will see an error message in the logs/dashboard.

3. **Remote Status Checks**:
   Autopilot frequently checks the remote repository status to detect if your local branch has diverged.

## Enabling Team Mode

To enable Team Mode, run:

```bash
autopilot init
```
And select "Yes" when asked "Enable team mode? (pull before push)".

Or manually edit your `.autopilotrc.json`:

```json
{
  "teamMode": true
}
```

## Best Practices for Teams

- **Short Commit Intervals**: Set `commitInterval` to a lower value (e.g., 5-10 minutes) to reduce the chance of large conflicts.
- **Feature Branches**: Continue to use feature branches (`feat/my-feature`). Autopilot works best on feature branches, leaving `main` or `develop` protected.
- **Dashboard Monitoring**: Use `autopilot dashboard` to keep an eye on the automation status and pending changes.

## Troubleshooting

If Autopilot stops due to a conflict:
1. Run `git status` to see the conflict.
2. Resolve the conflicts manually.
3. Run `git add .` and `git rebase --continue`.
4. Restart Autopilot with `autopilot start`.
