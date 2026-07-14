# 🚀 Autopilot

<div align="center">

![Autopilot Logo](https://img.shields.io/badge/Autopilot-blue?style=for-the-badge&logo=git&logoColor=white)

**An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.**

**Latest release:** v4.0.0 brings free-model defaults, automatic leaderboard sync, branch-specific rules, offline mode, commit signing, and richer docs.

[![npm version](https://img.shields.io/npm/v/@traisetech/autopilot?style=flat-square&color=success)](https://www.npmjs.com/package/@traisetech/autopilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Downloads](https://img.shields.io/npm/dm/@traisetech/autopilot?style=flat-square&color=blue)](https://www.npmjs.com/package/@traisetech/autopilot)
[![GitHub Stars](https://img.shields.io/github/stars/PraiseTechzw/autopilot-cli?style=flat-square&color=gold)](https://github.com/PraiseTechzw/autopilot-cli/stargazers)
[![Build Status](https://img.shields.io/github/actions/workflow/status/PraiseTechzw/autopilot-cli/ci.yml?style=flat-square)](https://github.com/PraiseTechzw/autopilot-cli/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**Built by [Praise Masunga](https://github.com/PraiseTechzw) (PraiseTechzw)**

[Features](#-features) • [Installation](#-installation) • [How It Works](#-how-autopilot-works) • [Safety & Guarantees](#-safety--guarantees) • [Commands](#-commands)

</div>

---

## 📖 Table of Contents

- [Why Autopilot](#-why-autopilot)
- [How Autopilot Works](#-how-autopilot-works)
- [Safety & Guarantees](#-safety--guarantees)
- [Failure & Recovery](#-failure--recovery)
- [AI & Privacy](#-ai--privacy)
- [Leaderboard & Metrics](#-leaderboard--metrics)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why Autopilot

Most AI commit tools — `aicommits`, `opencommit`, and similar — are **on-demand**: you run a command, review a suggestion, confirm it. That's an improvement over writing commit messages by hand, but you're still the one who has to remember to do it.

Autopilot is different: it's a background daemon, not a command you run. You code; it watches, batches, commits, and pushes — safely, and without asking. The design goal isn't "more AI features," it's **you never have to think about Git during a coding session.**

| | Autopilot | Typical on-demand tools |
|---|---|---|
| Runs automatically in the background | ✅ | ❌ (manual invocation) |
| Free AI model, zero configuration | ✅ (auto-selected via OpenRouter) | Usually requires picking a paid model |
| Beginner-friendly defaults | ✅ (can even run `git init` for you) | Assumes Git familiarity |
| Undo safety net | ✅ (`autopilot undo`) | Varies |
| Protected-branch guard rails | ✅ (`main`/`master` blocked by default) | Not typically built in |

---

## 🔍 How Autopilot Works

Autopilot is a local CLI tool that runs in the background of your terminal. It watches your file system for changes and automates the Git workflow based on your configuration.

**No magic. Just automation.**

1. **Watch** — monitors your project directory for file modifications, creations, and deletions.
2. **Wait** — uses a smart debounce timer (default: 20s) so it waits until you stop typing.
3. **Check** — verifies repository status (branch, remote, conflicts) before acting.
4. **Commit** — stages changes and creates a commit. If AI is enabled, it generates a meaningful message; otherwise, it uses a smart template.
5. **Push** — pushes to your remote repository (optional, enabled by default).

You can stop, pause, or undo Autopilot at any time.

---

## 🛡️ Safety & Guarantees

We prioritize the safety of your code above all else. Autopilot follows strict rules to ensure your work is never lost or corrupted.

### Non-negotiable guarantees

- **Never force-pushes** — only standard `git push` operations. It will never overwrite remote history.
- **Never commits ignored files** — strictly respects your `.gitignore` and `.autopilotignore` rules.
- **Never operates during merge/rebase** — if your repo is in a merge, rebase, or cherry-pick state, Autopilot pauses automatically.
- **Never transmits source code without opt-in** — your code stays local. It's only sent to an AI provider when you explicitly enable AI features and provide your own API key.
- **Pauses when uncertain** — if a git error occurs, a conflict is detected, or the network fails, Autopilot pauses and waits for your intervention.
- **Everything is undoable** — `autopilot undo` safely reverts the last automated commit without losing your file changes.

---

## ⚠️ Failure & Recovery

What happens when things go wrong? Autopilot is designed to fail safely.

- **Merge conflicts** — if a `git pull` results in a conflict, Autopilot aborts the operation and notifies you. It will not attempt to resolve conflicts automatically.
- **Network issues** — if the internet disconnects, Autopilot queues commits locally and attempts to push once connectivity is restored (if auto-push is enabled).
- **No remote configured** — Autopilot commits locally and logs that no push destination is set, rather than failing. Add a remote at any time with `git remote add origin <url>` and pushes will resume automatically.
- **Accidental commits** — if Autopilot commits something you didn't intend, run `autopilot undo`. Your files remain modified in your working directory, but the commit itself is removed.

> **Verify before you rely on it:** the "no remote configured" behavior above describes the intended design. If you're testing a fresh checkout, confirm it actually degrades gracefully rather than erroring — this is the kind of first-run failure that costs a new user's trust immediately.

---

## 🤖 AI & Privacy

Autopilot offers **optional** AI integration through [OpenRouter](https://openrouter.ai) to generate context-aware commit messages, using free models selected and rotated automatically — you don't pick a model or manage multiple provider accounts.

- **Opt-in only** — AI features are disabled by default. You must enable them and provide your own free API key.
- **Data usage** — when enabled, only the `git diff` (text changes) is sent to the AI provider to generate the message.
- **Privacy** — Autopilot doesn't train on your code, store it, or proxy it. The connection is directly between your machine and OpenRouter.
- **Ranking** — AI usage doesn't affect your position on the leaderboard.

### 🔑 Handling your API key safely

**Don't paste your API key directly into `.autopilotrc.json`.** That file isn't gitignored by default, and a key sitting in a tracked file will eventually get committed — the exact kind of mistake Autopilot's own secret-scanning feature is supposed to catch. Use an environment variable instead:

```bash
# macOS / Linux (add to ~/.bashrc, ~/.zshrc, etc.)
export OPENROUTER_API_KEY="your-key-here"

# Windows (PowerShell)
setx OPENROUTER_API_KEY "your-key-here"
```

Autopilot reads `OPENROUTER_API_KEY` from the environment automatically — no config file entry needed. The `apiKey` field in `.autopilotrc.json` is supported as a fallback for CI or containerized environments where env vars are managed elsewhere, but if you use it, make sure that file is gitignored first.

---

## 🏆 Leaderboard & Metrics

Autopilot includes a Focus Engine that tracks your local productivity (coding time, commit streaks). You can optionally sync this data to the global leaderboard.

- **Participation is opt-in** — enable syncing explicitly with `autopilot config set leaderboard.sync true`.
- **Privacy-safe** — no email or username is sent directly; IDs are hashed and anonymized.
- **No code collected** — the leaderboard tracks *metrics* (time, counts), never file contents.
- **Insight over competition** — the goal is understanding your habits, not gamifying commit spam. Rankings favor consistency and quality over raw volume.

---

## 🧭 Roadmap

We keep the roadmap focused on the things that make Autopilot more useful in real projects:

- Better real-world usage guides for CI/CD, team workflows, and monorepos.
- Stronger troubleshooting coverage for AI, dashboard, and sync failures.
- Better performance guidance for large repositories.
- Improved accessibility and localization support.
- A clearer extensibility story for future plugins and integrations.

If you want to help, check the docs site and [Contributing](#-contributing) for the easiest places to jump in.

---

## ⬇️ Installation

Install Autopilot globally using npm:

```bash
npm install -g @traisetech/autopilot
```

Or run it directly via npx:

```bash
npx @traisetech/autopilot start
```

**Requirements:** Node.js 18+, Git on your `PATH`. Fully supported on Windows, macOS, and Linux.

---

## 🚀 Quick Start

1. **Navigate to your Git repository:**
   ```bash
   cd /path/to/my-project
   ```

2. **Initialize Autopilot:**
   ```bash
   autopilot init
   ```
   Follow the interactive prompts to configure settings (or accept the defaults). If the folder isn't a git repository yet, Autopilot can create one for you and explains what that means in plain language.

3. **Start the watcher:**
   ```bash
   autopilot start
   ```
   Autopilot is now running — it monitors file changes and automatically commits/pushes them based on your configuration.

4. **View the dashboard:**
   Open a new terminal and run:
   ```bash
   autopilot dashboard
   ```

New to Git entirely? Run `npx @traisetech/autopilot guide` for an interactive walkthrough that explains each step in plain language as it goes.

---

## 🎨 VS Code Extension (Recommended)

Prefer a GUI? Use the official **Autopilot VS Code Extension**:

- **Live sidebar** — monitor status, branch, and queue at a glance.
- **Integrated logs** — view color-coded process output directly in your editor.
- **Quick actions** — start, stop, pause, and undo with a single click from the status bar.
- **Settings UI** — form-based configuration of your `.autopilotrc.json`.

**[Install from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=praisetechzw.autopilot-vscode)**

---

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `autopilot init` | Initialize configuration in the current repo. |
| `autopilot start` | Start the watcher process (foreground). |
| `autopilot stop` | Stop the running watcher process. |
| `autopilot status` | Check if Autopilot is running. |
| `autopilot pause` | Temporarily pause automation. |
| `autopilot resume` | Resume automation. |
| `autopilot undo` | Revert the last Autopilot commit. |
| `autopilot dashboard` | View real-time status and activity UI. |
| `autopilot insights` | View productivity stats and analytics. |
| `autopilot leaderboard` | Sync or view your global ranking. |
| `autopilot preset` | Apply a pre-configured workflow (`safe-team`, `solo-speed`, `strict-ci`). |
| `autopilot config` | Get/set individual configuration values. |
| `autopilot doctor` | Diagnose configuration and environment issues. |
| `autopilot guide` | Interactive, beginner-friendly walkthrough. |

Full flag-by-flag reference: [CLI Reference](docs/commands.md)

<details>
<summary><strong>Platform integration notes (click to expand)</strong></summary>

Many commands (`status`, `doctor`, `start`, `config`) support a `--json` flag to return structured output suitable for reading programmatically (e.g. by the VS Code extension).

**Exit codes:**

| Code | Meaning |
|---|---|
| `0` | Success / running |
| `1` | General error (runtime failure) |
| `2` | Not a git repository |
| `3` | Not initialized |
| `4` | Blocked branch |
| `5` | Invalid configuration |
| `6` | Watcher already running |
| `7` | Watcher not running |

</details>

---

## ⚙️ Configuration

Autopilot uses an `.autopilotrc.json` file in your project root:

```json
{
  "debounceSeconds": 20,
  "minSecondsBetweenCommits": 180,
  "autoPush": true,
  "blockBranches": ["main", "master"],
  "teamMode": true,
  "preventSecrets": true,
  "ai": {
    "enabled": true,
    "provider": "openrouter"
  }
}
```

> Note the `ai` block has no `apiKey` field — see [Handling your API key safely](#-handling-your-api-key-safely) above for why, and how to set it via environment variable instead.

| Key | Description |
|---|---|
| `debounceSeconds` | How long to wait after the last file change before committing. |
| `minSecondsBetweenCommits` | Minimum gap enforced between automated commits. |
| `autoPush` | Whether to push after committing. |
| `blockBranches` | Branches Autopilot will never push to directly. |
| `teamMode` | Enables pull-before-push and stricter collaboration checks. |
| `preventSecrets` | Scans staged changes for likely secrets before committing. |
| `ai.enabled` | Turns on AI-generated commit messages. |
| `ai.provider` | Currently supports `openrouter`. |

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for the full reference.

---

## 📈 Star History

<a href="https://star-history.com/#PraiseTechzw/autopilot-cli&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=PraiseTechzw/autopilot-cli&type=Date&theme=dark" />
    <img src="https://api.star-history.com/svg?repos=PraiseTechzw/autopilot-cli&type=Date" alt="Star History Chart" />
  </picture>
</a>

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
