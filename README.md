# Autopilot CLI

Autopilot is a local Git automation CLI with optional OpenRouter-powered commit messages, a live web dashboard, and an opt-in productivity leaderboard.

## What it does

- Watches a Git repository and batches file changes safely.
- Creates conventional commit messages using free OpenRouter models when an API key is configured; falls back to local rule-based messages when AI is disabled.
- Blocks protected branches and detects common secret patterns before a commit.
- Pushes through normal Git remotes, including GitHub remotes already configured as `origin`.
- Pairs a local CLI with the web dashboard to stream real watcher events and commits.

## Requirements

- Node.js 18 or later (Node 24 is used in CI)
- pnpm 9 or later
- Git
- An OpenRouter API key only if AI commit messages are enabled

## Local development

```bash
pnpm install
cp .env.example .env
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/autopilot-docs run dev
```

In another terminal, inside a Git repository you want to monitor:

```bash
pnpm --dir /path/to/autopilot-cli run cli -- init
pnpm --dir /path/to/autopilot-cli run cli -- connect AP-1234 --api http://localhost:5000 --web-url http://localhost:3000 --start
```

Open `http://localhost:3000/playground?code=AP-1234` to see live events. Use `autopilot leaderboard --sync` to submit your real, opt-in local metrics.

## GitHub

Autopilot works with GitHub through normal Git authentication and an `origin` remote. Configure GitHub CLI or SSH once, then add a remote:

```bash
gh auth login
git remote add origin git@github.com:OWNER/REPOSITORY.git
```

The CLI never stores GitHub tokens. A future in-product “Connect GitHub” button requires a GitHub OAuth App or GitHub App with production callback URLs and credentials; see `docs/GITHUB_APP_SETUP.md` once it is added.

## Quality checks

```bash
pnpm run typecheck
pnpm --filter @traisetech/autopilot run test
pnpm --filter @workspace/autopilot-docs run build
pnpm --filter @workspace/api-server run build
```

## Publishing

The npm package is `@traisetech/autopilot`. Inspect the release contents before publishing:

```bash
cd artifacts/autopilot-cli
npm pack --dry-run
```

See the package README for CLI usage and `replit.md` for workspace architecture.
