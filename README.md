# 🚀 Autopilot

<div align="center">

<img src="https://autopilot-cli.vercel.app/favicon.svg" width="120" height="120" alt="Autopilot Logo" />

# Autopilot CLI v2.4.0
**The Intelligent Git Engine That Respects Your Flow.**

[![npm version](https://img.shields.io/npm/v/@traisetech/autopilot?style=for-the-badge&color=blue)](https://www.npmjs.com/package/@traisetech/autopilot)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/@traisetech/autopilot?style=for-the-badge&color=violet)](https://www.npmjs.com/package/@traisetech/autopilot)
[![GitHub Stars](https://img.shields.io/github/stars/PraiseTechzw/autopilot-cli?style=for-the-badge&color=ffd700)](https://github.com/PraiseTechzw/autopilot-cli/stargazers)

[**Explore Documentation**](https://autopilot-cli.vercel.app) • [**View Leaderboard**](https://autopilot-cli.vercel.app/leaderboard) • [**Report Bug**](https://github.com/PraiseTechzw/autopilot-cli/issues)

</div>

---

## 💎 Why Autopilot?

Autopilot isn't just a "git commit" wrapper. It's a **flow-state companion** designed for high-velocity developers who don't want to break their concentration for repetitive git operations.

-   **Intelligent Sync**: Automates the commit-push cycle with smart debouncing that respects your typing patterns.
-   **Local-First Architecture**: Your code NEVER leaves your machine. Automation is 100% local.
-   **Zero-Config Simplicity**: Works out of the box with `autopilot init`, but offers surgical control for power users.
-   **AI-Assisted Clarity**: Optional integration with Gemini or Grok to generate meaningful, human-readable commit messages.
-   **Focus Engine**: Track your coding streaks and focus minutes without external time trackers.

---

## 🛠️ Performance & Safety Rails

We built Autopilot with a **"Trust First"** philosophy. It includes hard-coded safety guarantees that make it impossible to break your repository history.

### 🛡️ Non-Negotiable Guarantees
-   **No Force-Pushes**: Autopilot will never overwrite remote history.
-   **Conflict Awareness**: Automatically pauses if a merge conflict is detected.
-   **Secret Prevention**: Scans and blocks commits containing `.env` files or potential API keys.
-   **Implicit Reversibility**: Every automated action can be reverted instantly with `autopilot undo`.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install -g @traisetech/autopilot
```

### 2. Quick Setup
Run the interactive guide to learn the ropes:
```bash
autopilot guide
```

### 3. Initialize Your Repo
```bash
cd /path/to/project
autopilot init
```

### 4. Lift Off
```bash
autopilot start
```

---

## 📊 The Command Suite

| Command | Purpose |
| :--- | :--- |
| `autopilot start` | Launch the intelligent background watcher. |
| `autopilot dashboard` | View real-time activity in a high-fidelity TUI. |
| `autopilot insights` | Deep-dive into your productivity and streak data. |
| `autopilot undo` | Roll back the last automated commit & preserve changes. |
| `autopilot guide` | **(NEW)** Interactive walkthrough and onboarding. |
| `autopilot doctor` | Validate your environment and diagnostic health. |
| `autopilot status` | Instant pulse-check on the automation engine. |

---

## 🔒 Privacy & AI Transparency

-   **Opt-In AI**: AI features are strictly disabled by default. You provide your own keys; we never see them.
-   **No Code Collection**: We do not store, proxy, or train on your source code.
-   **Anonymized Metrics**: Leaderboard data uses cryptographic hashes to preserve your identity while celebrating your progress.

---

## 🤝 Contributing

Autopilot is built by the community. Want to help?
1. Check out our [Architecture Overview](docs/ARCHITECTURE.md).
2. Look for `good-first-issue` labels.
3. Join the mission to automate developer productivity.

---

<div align="center">
Built with ❤️ by <b>Praise Masunga (PraiseTechzw)</b>
<br/>
<i>Git automation that respects your control.</i>
</div>
