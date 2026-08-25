# Release and publication guide

This repository has two related publication surfaces: the Autopilot CLI package and the Autopilot VS Code extension. The CLI package is published to npm under `@traisetech/autopilot`; the extension is packaged as a VSIX and published to the Visual Studio Marketplace under publisher `PraiseTechzw` and extension ID `PraiseTechzw.autopilot-vscode`.

## VS Code Marketplace

The extension lives in `vscode-extension/`. Run the local checks and package build before publishing:

```bash
cd vscode-extension
npm install --global @vscode/vsce
npm run check
npm run package
```

The package manifest uses `media/autopilot.png` because the Marketplace publisher rejects user-provided SVG images. The generated VSIX can be installed locally through **Extensions → Install from VSIX**.

For a manual publication, authenticate with the publisher account and run:

```bash
VSCE_PAT='do-not-paste-secrets-into-files' npm run publish
```

For automated publication, add an encrypted GitHub Actions secret named `VSCE_PAT`, then create a tag matching `vscode-v*`, for example `vscode-v0.1.1`. The workflow at `.github/workflows/publish-vscode-extension.yml` validates, packages, and publishes the extension. A Marketplace publisher and a token with Marketplace manage permission are required. Prefer Microsoft Entra ID workload identity federation for long-lived automation; Azure DevOps global PATs are scheduled for retirement on December 1, 2026.

## npm package

Inspect the package contents before releasing the CLI:

```bash
npm pack --dry-run
npm test
npm run lint
```

Publish only a new semantic version, because npm does not allow reusing an already published name/version pair:

```bash
npm version patch
npm publish --access public
```

The npm registry must already be authenticated through `npm login`, an npm access token, or the release environment’s secure credential store. Never commit `.npmrc` files containing tokens.

## GitHub release

Push the version commit and create a GitHub release from the corresponding tag. The release notes should link to the Marketplace listing, the VSIX artifact, the npm package, and the website documentation. GitHub Actions should remain the source of truth for Marketplace publication so that no token is placed in a commit or shell history.

## Website and documentation

Update the repository README, `vscode-extension/README.md`, `vscode-extension/CHANGELOG.md`, and the website installation and release pages in `autopilot-docs/content/docs/`. Run the website checks before publishing:

```bash
cd autopilot-docs
npm run lint
npm run build
```

The website should link only to the real Marketplace listing after the first successful publication. Until then, document the VSIX installation path and keep the Marketplace URL marked as pending rather than presenting an unpublished listing as available.
