# 🚀 Autopilot

<div align="center">

![Autopilot Logo](https://img.shields.io/badge/Autopilot-blue?style=for-the-badge&logo=git&logoColor=white)

**Intelligent Git automation that commits and pushes your code, so you can focus on building.**

[![npm version](https://img.shields.io/npm/v/@traisetech/autopilot?style=flat-square&color=success)](https://www.npmjs.com/package/@traisetech/autopilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![Downloads](https://img.shields.io/npm/dm/@traisetech/autopilot?style=flat-square&color=blue)](https://www.npmjs.com/package/@traisetech/autopilot)
[![GitHub Stars](https://img.shields.io/github/stars/PraiseTechzw/autopilot-cli?style=flat-square&color=gold)](https://github.com/PraiseTechzw/autopilot-cli/stargazers)
[![Build Status](https://img.shields.io/github/actions/workflow/status/PraiseTechzw/autopilot-cli/ci.yml?style=flat-square)](https://github.com/PraiseTechzw/autopilot-cli/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**Built by [Praise Masunga](https://github.com/PraiseTechzw) (PraiseTechzw)**

[Features](#-features) • [Installation](#-installation) • [Quick Start](#-quick-start) • [Configuration](#-configuration) • [Commands](#-commands)

</div>

---

## 📖 Table of Contents

- [Why Autopilot?](#-why-autopilot)
- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Commands](#-commands)
- [Configuration](#-configuration)
- [Safety Features](#-safety-features)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Why Autopilot?

Autopilot is designed for developers who want to stay in the flow. It solves manual Git workflow fatigue by handling the repetitive cycle of staging, committing, and pushing changes, allowing you to focus entirely on writing code.

<table>
<tr>
<td width="50%">

### ❌ Before Autopilot

```bash
# Every. Single. Time.
git add .
git commit -m "update stuff"
git push

# Repeat 50+ times a day...
# Lose focus on coding
# Forget to commit
# Inconsistent messages
```

</td>
<td width="50%">

### ✅ With Autopilot

```bash
# One time setup
autopilot init
autopilot start

# That's it! 
# Focus on coding
# Auto-commits with smart messages
# Never lose work again
```

</td>
</tr>
</table>

---

## ✨ Features
 
- **🧠 AI Commit Messages**: Gemini 2.5-powered, context-aware conventional commit messages.
- **⚡ Watcher Engine**: Real-time file monitoring with smart debouncing using `chokidar`.
- **🛡️ Safety First**: Blocks commits on protected branches and checks remote status.
- **🔄 Automated Flow**: Fetches, stages, commits, and pushes (optional) automatically.
- **👥 Team Mode**: Pull-before-push and conflict abortion with preset workflows.
- **🖥️ Dashboard**: Real-time terminal dashboard with status and activity feed.
- **⏮️ Undo System**: Safely rollback the last autopilot commit with one command.
- **📊 Focus Engine & Insights**: Track active coding time, streaks, peak hours, and commit quality.
- **⚙️ Zero Config**: Works out of the box, but fully configurable via `.autopilotrc.json`.
- **🩺 Self-Healing**: Includes a `doctor` command to diagnose and fix issues.

---
 
## 🆕 What's New in v2.0
 
- AI commit generation via Google Gemini (opt-in, with graceful fallback).
- Team presets (`safe-team`, `solo-speed`, `strict-ci`) for different workflows.
- Safety net with `autopilot undo`, secret detection, and large-file prevention.
- Productivity Focus Engine with `autopilot insights` and CSV export.

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

1. **Navigate to your Git repository:**
   ```bash
   cd /path/to/my-project
   ```

2. **Initialize Autopilot:**
   ```bash
   autopilot init
   ```
   Follow the interactive prompts to configure settings (or accept defaults).

3. **Start the watcher:**
   ```bash
   autopilot start
   ```

   **Autopilot is now running!** It will monitor file changes and automatically commit/push them based on your configuration.

4. **View the Dashboard (New):**
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
| `autopilot pause [reason]` | Temporarily pause automation. |
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
  "maxFileSizeMB": 50
}
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for full details.

---

## 🛡️ Safety Features

Autopilot includes multiple layers of protection:

1. **Branch Protection**: Prevents running on blocked branches (default: `main`, `master`).
2. **Secret Detection**: Scans for AWS keys, GitHub tokens, and other secrets before committing.
3. **File Size Limits**: Prevents committing accidental large files (>50MB).
4. **Team Mode**: Ensures local changes are rebased on top of remote changes to prevent conflicts.
5. **Undo**: Allows quick recovery from unwanted auto-commits.

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
