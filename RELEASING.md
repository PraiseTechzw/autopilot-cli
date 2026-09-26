# Release Process

Releases are built from version tags and published as GitHub Release assets. Do not commit generated wheels, source archives, VSIX files, local `.env` files, or dependency directories.

## Prepare a release

1. Update `src/autopilot/__init__.py`, `vscode-extension/package.json`, and `vscode-extension/package-lock.json` to the same release version. The Python project reads its version from `autopilot.__version__`.
2. Update `CHANGELOG.md` and the user-facing version references.
3. Run `pytest`, `npm test` from `vscode-extension/`, `python -m build`, and `npm run package` from `vscode-extension/`.
4. Merge the release commit to `main`, then create and push a matching `v1.x.y` tag from that commit.

The Release workflow reruns the Python test matrix and extension tests before building and attaching the wheel, source distribution, and VSIX. Its publish job alone receives `contents: write`; tests run with read-only repository permissions.

## Repository safeguards

- Protect `main` in GitHub settings and require the Python and extension test jobs before merging.
- Keep API keys in a developer's environment or secret manager. `.env` is intentionally ignored; `.env.example` contains blank values only.
- If a credential is committed or pushed, revoke it first. Removing a file in a later commit does not remove the credential from Git history; coordinate a history rewrite and force-push with repository collaborators.