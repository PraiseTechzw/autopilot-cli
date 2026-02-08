# 🚀 Autopilot

<div align="center">

![Autopilot Logo](https://img.shields.io/badge/Autopilot-blue?style=for-the-badge&logo=git&logoColor=white)

**An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.**

[![npm version](https://img.shields.io/npm/v/@traisetech/autopilot?style=flat-square&color=success)](https://www.npmjs.com/package/@traisetech/autopilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![Downloads](https://img.shields.io/npm/dm/@traisetech/autopilot?style=flat-square&color=blue)](https://www.npmjs.com/package/@traisetech/autopilot)
[![GitHub Stars](https://img.shields.io/github/stars/PraiseTechzw/autopilot-cli?style=flat-square&color=gold)](https://github.com/PraiseTechzw/autopilot-cli/stargazers)
[![Build Status](https://img.shields.io/github/actions/workflow/status/PraiseTechzw/autopilot-cli/ci.yml?style=flat-square)](https://github.com/PraiseTechzw/autopilot-cli/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**Built by [Praise Masunga](https://github.com/PraiseTechzw) (PraiseTechzw)**

[Features](#-features) • [Installation](#-installation) • [How It Works](#-how-autopilot-works) • [Safety & Guarantees](#-safety--guarantees) • [Commands](#-commands)

</div>

---

## 📖 Table of Contents

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

## 🔍 How Autopilot Works

Autopilot is a local CLI tool that runs in the background of your terminal. It watches your file system for changes and automates the Git workflow based on your configuration.

**No Magic. Just Automation.**

1.  **Watch**: It monitors your project directory for file modifications, creations, and deletions.
2.  **Wait**: It uses a smart debounce timer (default: 20s) to wait until you stop typing.
3.  **Check**: It verifies the repository status (branch, remote, conflicts) before acting.
4.  **Commit**: It stages changes and creates a commit. If AI is enabled, it generates a meaningful message; otherwise, it uses a smart template.
5.  **Push**: It pushes to your remote repository (optional, enabled by default).

You can stop, pause, or undo Autopilot at any time.

---

## 🛡️ Safety & Guarantees

We prioritize the safety of your code above all else. Autopilot follows strict rules to ensure your work is never lost or corrupted.

### Non-Negotiable Guarantees

-   **Never force-pushes**: Autopilot only performs standard `git push` operations. It will never overwrite remote history.
-   **Never commits ignored files**: It strictly respects your `.gitignore` and `.autopilotignore` rules.
-   **Never operates during merge/rebase**: If your repo is in a merge, rebase, or cherry-pick state, Autopilot pauses automatically.
-   **Never transmits source code without opt-in**: Your code stays local. It is only sent to an AI provider (Gemini/Grok) if you explicitly enable AI features and provide your own API key.
-   **Pauses when uncertain**: If a git error occurs, a conflict is detected, or the network fails, Autopilot pauses and waits for your intervention.
-   **Allows all actions to be undone**: The `autopilot undo` command safely reverts the last automated commit without losing your file changes.

---

## ⚠️ Failure & Recovery

What happens when things go wrong? Autopilot is designed to fail safely.

-   **Merge Conflicts**: If a `git pull` results in a conflict, Autopilot aborts the operation and notifies you. It will not attempt to resolve conflicts automatically.
-   **Network Issues**: If the internet disconnects, Autopilot will queue commits locally and attempt to push when connectivity is restored (if auto-push is enabled).
-   **Accidental Commits**: If Autopilot commits something you didn't intend, simply run `autopilot undo`. Your files will remain modified in your working directory, but the commit will be removed.

---

## 🤖 AI & Privacy

Autopilot offers **optional** AI integration (Google Gemini or xAI Grok) to generate context-aware commit messages.

-   **Opt-In Only**: AI features are disabled by default. You must enable them and provide your own API key.
-   **Data Usage**: When enabled, only the `git diff` (text changes) is sent to the AI provider to generate the message.
-   **Privacy**: Your code is not trained on by Autopilot. We do not store or proxy your code. Interactions are directly between your machine and the AI provider.
-   **Ranking**: AI usage does not affect your position on the Leaderboard.

---

## 🏆 Leaderboard & Metrics

Autopilot includes a Focus Engine that tracks your local productivity (coding time, commit streaks). You can optionally sync this data to the global Leaderboard.

-   **Participation is Opt-In**: You must explicitly enable syncing with `autopilot config set leaderboard.sync true`.
-   **Privacy-Safe**: We do not send your email or username directly. IDs are hashed/anonymized.
-   **No Code Collected**: The leaderboard tracks *metrics* (time, counts), not code. No file contents are ever synced.
-   **Insight over Competition**: The goal is to help you understand your habits, not to gamify commit spam. Rankings favor consistency and quality.

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

---

## 🚀 Quick Start

1.  **Navigate to your Git repository:**
    ```bash
    cd /path/to/my-project
    ```

2.  **Initialize Autopilot:**
    ```bash
    autopilot init
    ```
    Follow the interactive prompts to configure settings (or accept defaults).

3.  **Start the watcher:**
    ```bash
    autopilot start
    ```

    **Autopilot is now running!** It will monitor file changes and automatically commit/push them based on your configuration.

4.  **View the Dashboard:**
    Open a new terminal and run:
    ```bash
    autopilot dashboard
    ```

---

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `autopilot init` | Initialize configuration in the current repo. |
| `autopilot start` | Start the watcher process (foreground). |
| `autopilot stop` | Stop the running watcher process. |
| `autopilot status` | Check if Autopilot is running. |
| `autopilot dashboard` | View real-time status and activity UI. |
| `autopilot undo` | Revert the last Autopilot commit. |
| `autopilot pause` | Temporarily pause automation. |
| `autopilot resume` | Resume automation. |
| `autopilot insights` | View productivity stats and analytics. |
| `autopilot doctor` | Diagnose configuration and environment issues. |

---

## ⚙️ Configuration

Autopilot uses an `.autopilotrc.json` file in your project root.

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
    "provider": "gemini"
  }
}
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for full details.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1.  Fork the repo
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'feat: add amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
