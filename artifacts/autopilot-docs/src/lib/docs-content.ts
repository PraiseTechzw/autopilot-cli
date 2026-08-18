export interface DocArticle {
  slug: string;
  title: string;
  description: string;
  route: string;
  content: string;
}

export const ALL_DOCS: DocArticle[] = [
  {
    slug: 'index',
    title: 'Introduction',
    description: 'An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.',
    route: '/docs',
    content: `# What is Autopilot?

**Autopilot CLI** is an intelligent Git automation tool that safely commits and pushes your code so you can focus on building. It runs quietly in the background, watching your project files and handling Git operations for you — batching related changes, writing conventional commit messages, and syncing with your remote, all without interrupting your flow.

Most AI commit tools ask you to run a command every time you want a message written. Autopilot doesn't wait to be asked — it's the difference between a tool you operate and a tool that just takes care of things.

## What's New in v4.0.2

- **Free Model Defaults** — Autopilot now prefers free OpenRouter models and rotates through them automatically when one is unavailable.
- **Automatic Leaderboard Sync** — sync focus metrics while the watcher runs, with a built-in offline-safe escape hatch.
- **Branch Rules** — define branch-specific blocking, signing, and push policies with wildcard patterns.
- **Safety Net** — undo accidental commits instantly with \`autopilot undo\`, plus commit signing and offline mode for stricter workflows.
- **Interactive Web Tool** — test commands, simulate live file edits, and inspect watcher commit trees right in the [Web Playground](/playground).

It's designed for:

- 🚀 **Solo developers** who want to focus on coding, not committing.
- 🌱 **Beginners** who are still learning Git and want safe defaults instead of a learning curve.
- 👥 **Teams** who want to standardize commit quality and enforce safety checks.
- 🛡️ **Safety-conscious users** who never want to lose work.
- ⚡ **Rapid prototyping**, where speed matters more than granular commit history.

---

## Requirements

- Node.js 18 or later
- Git installed and available on your \`PATH\`
- Works on Windows, macOS, and Linux

---

## Quick Install

Install Autopilot globally using npm:

\`\`\`bash
npm install -g @traisetech/autopilot
\`\`\`

---

## 60-Second Quick Start

Follow these four commands to get up and running:

### 1. Initialize

Navigate to your project root and generate the configuration file. If you're starting from an empty folder, Autopilot will offer to set up Git for you too.

\`\`\`bash
autopilot init
\`\`\`

### 2. Start watching

Start the background daemon. Autopilot will now monitor your files and sync changes automatically.

\`\`\`bash
autopilot start
\`\`\`

> **Heads up:** by default, Autopilot won't push directly to \`main\` or \`master\` — this is a safety default, not a bug. See [Configuration](/docs/configuration) to change it once you're comfortable, or use \`autopilot preset solo-speed\` if you'd rather move fast on a personal project.

### 3. Check status

Verify that the watcher is running and see recent activity:

\`\`\`bash
autopilot status
\`\`\`

### 4. Stop

When you're done for the day, or need to switch branches manually:

\`\`\`bash
autopilot stop
\`\`\`

---

## Explore Documentation

- [Installation Guide](/docs/installation) — Complete setup instructions for Windows, macOS, Linux, and npx.
- [CLI Reference](/docs/commands) — Comprehensive reference of all commands, options, flags, and exit codes.
- [Configuration](/docs/configuration) — Customizing \`.autopilotrc.json\`, presets, and \`.autopilotignore\`.
- [Productivity & Leaderboard](/docs/productivity) — Insights engine, focus streaks, quality scores, and opt-in rankings.
- [Safety Features](/docs/safety) — Secret scanning, branch protection, undo mechanics, and merge safety.
- [Advanced Usage](/docs/advanced-usage) — Monorepos, CI/CD integration, git hooks, and multi-repo workflows.
- [Security](/docs/security) — Secret detection patterns, commit signing, and GitHub Actions safety.
- [Troubleshooting](/docs/troubleshooting) — Diagnosing common issues, doctor checks, and recovery procedures.
- [Interactive Web Playground](/playground) — Simulate commands, file edits, and live git watcher commits in browser!
`
  },
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Comprehensive installation guide for Windows, macOS, and Linux.',
    route: '/docs/installation',
    content: `# Installation

Getting started with Autopilot CLI is simple. It runs on any operating system that supports Node.js.

## Prerequisites

Before installing, ensure you have the following requirements:

- **Node.js**: Version **18.0.0** or higher.
- **Git**: Installed and available in your terminal path.

Check your versions:

\`\`\`bash
node --version
git --version
\`\`\`

---

## Windows

### Method 1: npm (Recommended)

Open **Command Prompt** or **PowerShell** and run:

\`\`\`bash
npm install -g @traisetech/autopilot
\`\`\`

### Method 2: pnpm / yarn

\`\`\`bash
# pnpm
pnpm add -g @traisetech/autopilot

# yarn
yarn global add @traisetech/autopilot
\`\`\`

### Troubleshooting Windows

**"Command not recognized" Error**
If \`autopilot\` isn't found after installation, your npm folder is likely missing from your system \`PATH\`.

1. Search for **"Edit the system environment variables"** in Start menu.
2. Click **Environment Variables**.
3. Under **User variables**, select \`Path\` and click **Edit**.
4. Click **New** and add: \`%APPDATA%\\npm\`
5. Click **OK** and restart your terminal.

---

## macOS

\`\`\`bash
npm install -g @traisetech/autopilot
\`\`\`

If you get an \`EACCES\` permission error, try using \`sudo\`:

\`\`\`bash
sudo npm install -g @traisetech/autopilot
\`\`\`

### Verify Installation

\`\`\`bash
autopilot --version
\`\`\`

---

## Linux

\`\`\`bash
npm install -g @traisetech/autopilot
\`\`\`

---

## No-Install Usage (npx)

You can run Autopilot without installing it globally using \`npx\`:

\`\`\`bash
npx @traisetech/autopilot start
\`\`\`

---

## Test Interactively in Browser

Want to test Autopilot without installing anything on your computer?
Open the [Interactive Web Playground](/playground) to run commands, simulate code edits, and watch auto-commits live!
`
  },
  {
    slug: 'quick-start',
    title: 'Quick Start',
    description: 'Go from zero to automated commits in under 5 minutes.',
    route: '/docs/quick-start',
    content: `# Quick Start Guide

This guide walks you through setting up Autopilot CLI in a new project and demonstrates its core functionality, end to end.

## 1. Set up a project

First, create a new directory and initialize a git repository:

\`\`\`bash
mkdir my-new-project
cd my-new-project
git init
\`\`\`

## 2. Initialize Autopilot

Run the initialization command to generate the default configuration file:

\`\`\`bash
autopilot init
\`\`\`

This creates a \`.autopilotrc.json\` file in your project root with safe defaults.

## 3. Connect a remote repository (Optional)

\`\`\`bash
git remote add origin https://github.com/your-username/my-new-project.git
\`\`\`

> **Skipping this step?** That's fine — Autopilot will still watch and commit locally. It logs \`[INFO] No remote configured — committing locally only\` instead of failing.

## 4. Recommended workflow: use a dev branch

\`\`\`bash
git checkout -b develop
\`\`\`

By default, Autopilot protects \`main\` and \`master\` from direct commits. Working on a branch ensures safe, frictionless automation.

## 5. (Optional) Enable AI commit messages

\`\`\`bash
autopilot config set ai.enabled true
\`\`\`

## 6. Start the watcher

\`\`\`bash
autopilot start
\`\`\`

## 7. Make some changes

Create or edit files in your workspace:

\`\`\`bash
echo "Hello Autopilot" > README.md
\`\`\`

Wait a few seconds (default debounce 20s) — Autopilot automatically stages changes, writes a conventional commit message, and pushes to your remote branch!

## 8. Monitor status & health

\`\`\`bash
autopilot status
autopilot doctor
autopilot insights
\`\`\`
`
  },
  {
    slug: 'commands',
    title: 'CLI Reference',
    description: 'Complete reference for all Autopilot CLI commands.',
    route: '/docs/commands',
    content: `# CLI Reference

Autopilot CLI exposes a set of commands to manage the background watcher process, check system health, and analyze productivity.

## Global options

| Flag | Description |
|---|---|
| \`--json\` | Return structured JSON output instead of formatted text. Supported by \`status\`, \`doctor\`, \`start\`, \`config\`, and \`insights\`. |
| \`--help\` | Show help for the command. |
| \`--version\` | Print the installed Autopilot version. |

---

## \`autopilot init\`

Initializes Autopilot in the current directory.

\`\`\`bash
autopilot init [--team] [--ai]
\`\`\`

- \`--team\`: Apply team collaboration settings (pull-before-push, secret scanning, large file guard).
- \`--ai\`: Enable AI-generated commit messages via OpenRouter (uses free tier automatically).

---

## \`autopilot start\`

Starts the background file watcher.

\`\`\`bash
autopilot start [--background] [--json]
\`\`\`

- \`--background\`: Run as detached background daemon.
- \`--json\`: Machine-readable startup status.

---

## \`autopilot stop\`

Gracefully stops the running watcher process and flushes any pending commits.

\`\`\`bash
autopilot stop
\`\`\`

---

## \`autopilot status\`

Checks whether the watcher daemon is running.

\`\`\`bash
autopilot status [--json]
\`\`\`

---

## \`autopilot pause\` & \`autopilot resume\`

Temporarily pause the watcher (e.g. during heavy refactoring or interactive rebase):

\`\`\`bash
autopilot pause "Refactoring database migrations"
autopilot resume
\`\`\`

---

## \`autopilot undo\`

Safely reverts the last commit made by Autopilot without losing your uncommitted work:

\`\`\`bash
autopilot undo
\`\`\`

---

## \`autopilot preset\`

Applies pre-configured workflow presets:

\`\`\`bash
autopilot preset safe-team
autopilot preset solo-speed
autopilot preset strict-ci
\`\`\`

---

## \`autopilot doctor\`

Runs a comprehensive environment and diagnostic health check:

\`\`\`bash
autopilot doctor [--json]
\`\`\`

Checks:
- Node.js version compatibility
- Git installation and authentication
- Branch rules and file permissions
- \`.autopilotrc.json\` schema validity
- Secret scanner readiness
- AI provider connectivity

---

## \`autopilot dashboard\`

Launches a live terminal TUI with watcher stats, file activity, and commit history.

\`\`\`bash
autopilot dashboard
\`\`\`

---

## \`autopilot insights\`

Displays productivity analytics: focus time, commit quality score, active streak, and peak coding hours.

\`\`\`bash
autopilot insights [--export csv|json]
\`\`\`

---

## \`autopilot leaderboard\`

Syncs your productivity stats with the global developer leaderboard or views rankings:

\`\`\`bash
autopilot leaderboard [--sync]
\`\`\`
`
  },
  {
    slug: 'configuration',
    title: 'Configuration',
    description: 'Customize Autopilot CLI behavior using configuration files.',
    route: '/docs/configuration',
    content: `# Configuration

Autopilot CLI is designed to be zero-config out of the box, but it also offers powerful customization options.

## \`.autopilotrc.json\`

The \`.autopilotrc.json\` file in your project root controls how Autopilot monitors and commits changes.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| \`minInterval\` | \`number\` | \`300\` | Minimum time (in seconds) between automatic commits. |
| \`autoPush\` | \`boolean\` | \`true\` | Whether to automatically push commits to remote. |
| \`blockedBranches\` | \`string[]\` | \`['main', 'master']\` | Branches where Autopilot is disabled to prevent accidental pushes. |
| \`branchRules\` | \`array\` | \`[]\` | Branch-specific wildcard rules for blocking commits, pushes, or signing. |
| \`requireChecks\` | \`boolean\` | \`false\` | If \`true\`, runs pre-commit linters and tests before committing. |
| \`offlineMode\` | \`boolean\` | \`false\` | If \`true\`, disables all network calls (commits locally only). |
| \`signCommits\` | \`boolean\` | \`false\` | If \`true\`, signs commits with GPG/SSH via \`git commit -S\`. |
| \`leaderboardSyncEnabled\` | \`boolean\` | \`true\` | Sync focus metrics to the leaderboard while the watcher runs. |

### AI Settings

\`\`\`json
{
  "ai": {
    "enabled": true,
    "provider": "openrouter",
    "apiKey": "YOUR_API_KEY",
    "model": "default",
    "interactive": false
  }
}
\`\`\`

### Team Settings

\`\`\`json
{
  "team": {
    "pullBeforePush": true,
    "preventSecrets": true,
    "preventLargeFiles": true
  }
}
\`\`\`

## \`.autopilotignore\`

Specify glob patterns to exclude from automated commits:

\`\`\`text
# Ignore temporary drafts and build artifacts
docs/drafts/*.md
dist/
*.log
local-config.json
\`\`\`
`
  },
  {
    slug: 'safety',
    title: 'Safety Rails',
    description: 'How Autopilot CLI protects your code and git history.',
    route: '/docs/safety',
    content: `# Safety Rails

Automation is powerful, but safety is paramount. Autopilot CLI includes multiple layers of built-in safety rails to guarantee that your repository is never corrupted.

## Non-Negotiable Guarantees

- **Never force-pushes**: Autopilot only performs standard \`git push\` operations. It will never overwrite remote history.
- **Never commits ignored files**: Strictly respects \`.gitignore\` and \`.autopilotignore\`.
- **Never operates during merge/rebase**: Pauses automatically if an active merge or rebase is detected.
- **Secret Scanning Guardrail**: Blocks commits containing leaked AWS, GitHub, Stripe, OpenAI, or database keys.
- **Undo Safety**: \`autopilot undo\` reverts commits cleanly without losing working directory modifications.
- **Branch Protection**: Refuses to push directly to \`main\` or \`master\` by default.
`
  },
  {
    slug: 'productivity',
    title: 'Productivity & Leaderboard',
    description: 'Track your focus, productivity streaks, and compete with yourself using Autopilot Insights.',
    route: '/docs/productivity',
    content: `# Productivity & Leaderboard

Autopilot includes a built-in **Focus Engine** that measures active coding time, commit quality, velocity, and habits.

## The \`insights\` Command

\`\`\`bash
autopilot insights
\`\`\`

Key Metrics:
- **Commit Quality Score**: An AI-evaluated score (0-100) assessing conventional commit adherence and clarity.
- **Focus Time**: Real-time tracking of active editing periods.
- **Active Streaks**: Number of consecutive days with meaningful commits.
- **Peak Hours**: Chronological distribution of peak coding productivity.

## Global Leaderboard (Opt-In)

Sync your metrics to the [Global Leaderboard](/leaderboard):

\`\`\`bash
autopilot leaderboard --sync
\`\`\`
`
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Solutions for common issues and debugging steps for Autopilot CLI.',
    route: '/docs/troubleshooting',
    content: `# Troubleshooting

If you run into issues with Autopilot CLI, follow these diagnostic steps.

## Step 1: Run Doctor

\`\`\`bash
autopilot doctor
\`\`\`

The doctor command inspects:
1. Node.js version (18+)
2. Git executable in PATH
3. Remote repository connection
4. \`.autopilotrc.json\` schema
5. Secret scanner regex engine

## Common Issues & Solutions

### 1. Watcher detects changes but doesn't commit
- **Check active branch**: Ensure you are on a feature branch (not \`main\` or \`master\`).
- **Check debounce window**: Allow 20s for changes to settle.
- **Check \`.gitignore\`**: Verify the file is not ignored.

### 2. Push fails with authentication error
- Autopilot uses your system git credentials. Configure SSH keys or Git Credential Manager so \`git push\` succeeds non-interactively.

### 3. Resetting a stuck daemon
\`\`\`bash
autopilot stop
rm .autopilot.pid
autopilot start
\`\`\`
`
  },
  {
    slug: 'advanced-usage',
    title: 'Advanced Usage',
    description: 'Real-world workflows for CI/CD, monorepos, team setups, and custom automation.',
    route: '/docs/advanced-usage',
    content: `# Advanced Usage

Learn how to integrate Autopilot CLI into complex development environments, monorepos, CI pipelines, and team workflows.

## CI/CD Integration

Use JSON flags in automated pipelines:

\`\`\`bash
autopilot doctor --json
autopilot status --json
autopilot insights --export json
\`\`\`

## Monorepos

When working with pnpm, npm, or turbo monorepos:
- Place \`.autopilotrc.json\` at the repository root.
- Add workspace build folders (\`dist/\`, \`.turbo/\`, \`.next/\`) to \`.autopilotignore\`.

## Git Hooks

Pair Autopilot with Husky or standard git hooks (\`pre-commit\`, \`commit-msg\`) for automated linting and formatting before commits are created.
`
  },
  {
    slug: 'security',
    title: 'Security',
    description: 'Secret scanning, signing, GitHub Actions, and other safety details.',
    route: '/docs/security',
    content: `# Security

Autopilot is built with a security-first philosophy:

## 1. Local Secret Scanning
Staged diffs are inspected locally before any commit is created. If an API key or credential is detected, the commit is aborted immediately.

## 2. Cryptographic Commit Signing
Enable \`"signCommits": true\` in \`.autopilotrc.json\` to sign every automated commit using your local GPG or SSH key.

## 3. Privacy
Your source code remains 100% on your machine. When AI is enabled, only concise diff chunks are processed for message generation.
`
  },
  {
    slug: 'benchmarks',
    title: 'Benchmarks',
    description: 'How to compare Autopilot with other commit assistants fairly.',
    route: '/docs/benchmarks',
    content: `# Benchmarks

How Autopilot compares to manual git operations and interactive commit generators:

- **Zero Interruption**: Autopilot commits in the background without prompting you at every save.
- **Low Resource Overhead**: Minimal CPU & memory footprint using native OS file system events.
- **High Commit Quality**: Adheres strictly to Conventional Commits standards with semantic tagging.
`
  },
  {
    slug: 'extensibility',
    title: 'Extensibility',
    description: 'Current extension points and what’s planned next.',
    route: '/docs/extensibility',
    content: `# Extensibility

Integrate Autopilot into your developer toolkit:

- **JSON Output**: Programmatic integration with editor extensions and scripts.
- **Git Hooks**: Seamless interoperability with existing pre-commit / post-commit hooks.
- **Custom AI Adapters**: Support for OpenRouter, custom endpoints, and free-tier model rotators.
`
  },
  {
    slug: 'contributing',
    title: 'Contributing',
    description: 'How to set up your environment and contribute to Autopilot CLI.',
    route: '/docs/contributing',
    content: `# Contributing

We welcome contributions from developers of all experience levels!

## Development Setup

1. Fork & clone the repo:
\`\`\`bash
git clone https://github.com/PraiseTechzw/autopilot-cli.git
cd autopilot-cli
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Run tests:
\`\`\`bash
pnpm test
\`\`\`

4. Link globally for local testing:
\`\`\`bash
npm link
\`\`\`
`
  },
  {
    slug: 'changelog',
    title: 'Changelog',
    description: 'Latest updates and improvements to Autopilot CLI.',
    route: '/docs/changelog',
    content: `# Changelog

### v4.0.2
- **Interactive Web Tool**: Added browser-based Web Playground with simulated terminal, code editor, live watcher, and commit visualizer.
- **Free Model Defaults**: OpenRouter rotation engine prioritizing 100% free models.
- **Leaderboard Auto-Sync**: Background focus telemetry sync with offline-safe caching.
- **Wildcard Branch Rules**: Granular branch-level commit, push, and signing policies.
- **Safety Net**: Instant rollback via \`autopilot undo\` and secret scanning filter.
`
  },
  {
    slug: 'roadmap',
    title: 'Roadmap',
    description: 'Community roadmap, contribution entry points, and areas we want to improve next.',
    route: '/docs/roadmap',
    content: `# Roadmap

Features currently under development and planned for upcoming releases:

- [x] Background Daemon with Debounce Engine
- [x] Conventional Commit AI Generator
- [x] Secret Scanner & Safety Guardrails
- [x] Interactive Web Playground & Simulator
- [ ] VS Code / Cursor IDE Extension
- [ ] Team Dashboards & Shared Velocity Metrics
- [ ] Local Offline LLM Integration (Ollama / Llama.cpp)
`
  },
  {
    slug: 'localization',
    title: 'Localization',
    description: 'Guidance for translating Autopilot docs and keeping the CLI accessible globally.',
    route: '/docs/localization',
    content: `# Localization

Autopilot CLI supports international developer teams. All command interfaces, error messages, and documentation follow standardized localization conventions.
`
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    description: 'How Autopilot stays usable for keyboard-first and assistive workflows.',
    route: '/docs/accessibility',
    content: `# Accessibility

Autopilot CLI is built keyboard-first:
- Plain terminal outputs with clean ANSI color contrast.
- Fully navigable documentation and Web Tool with \`Tab\` and \`Enter\`.
- \`--json\` flags for screen reader wrappers and automation pipelines.
`
  },
];

export function getDocBySlug(slug: string): DocArticle | undefined {
  const normalized = (slug || 'index').replace(/^\//, '').replace(/^docs\/?/, '').replace(/\/$/, '') || 'index';
  return ALL_DOCS.find(d => d.slug === normalized);
}

export function getAllDocs(): DocArticle[] {
  return ALL_DOCS;
}
