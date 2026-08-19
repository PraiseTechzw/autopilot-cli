# GitHub connection setup

Autopilot already supports GitHub repositories through Git remotes. That is the recommended connection for automatic commits and pushes: authenticate Git once with SSH or GitHub CLI, then use a normal `origin` remote.

## Git remote connection

```bash
gh auth login
git remote add origin git@github.com:OWNER/REPOSITORY.git
git push -u origin HEAD
```

Run `autopilot doctor` afterwards to confirm the remote is reachable.

## Future web OAuth connection

The web dashboard must not receive a personal access token. To add a “Connect GitHub” button, create a GitHub OAuth App (or preferably a GitHub App) owned by the project organisation, then configure:

- production and local callback URLs;
- a server-side encrypted token store;
- least-privilege permissions (repository metadata and contents only if required);
- CSRF state validation and token revocation;
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` as deployment secrets, never browser variables.

Those credentials and callback URLs are required before OAuth code can be implemented safely. Until then, Git remotes provide the needed GitHub integration without handling GitHub credentials in Autopilot.
