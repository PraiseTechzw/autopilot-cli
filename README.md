# 🚀 Autopilot CLI

<div align="center">

![Autopilot Logo](https://img.shields.io/badge/Autopilot-CLI-blue?style=for-the-badge&logo=git&logoColor=white)

**Intelligent Git automation that commits and pushes your code, so you can focus on building.**

[![npm version](https://img.shields.io/npm/v/autopilot-cli?style=flat-square&color=success)](https://www.npmjs.com/package/autopilot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square)](https://nodejs.org)
[![Downloads](https://img.shields.io/npm/dm/autopilot-cli?style=flat-square&color=blue)](https://www.npmjs.com/package/autopilot-cli)
[![GitHub Stars](https://img.shields.io/github/stars/PraiseTechzw/autopilot-cli?style=flat-square&color=gold)](https://github.com/PraiseTechzw/autopilot-cli/stargazers)
[![Build Status](https://img.shields.io/github/actions/workflow/status/PraiseTechzw/autopilot-cli/ci.yml?style=flat-square)](https://github.com/PraiseTechzw/autopilot-cli/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**Built by [Praise Masunga](https://github.com/PraiseTechzw) (PraiseTechzw)**

[Features](#-features) • [Quick Start](#-quick-start) • [Configuration](#-configuration) • [Commands](#-commands) • [Safety](#-safety-features)

</div>

---

## 📖 Table of Contents

- [Why Autopilot?](#-why-autopilot)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Commands](#-commands)
- [Configuration](#-configuration)
- [Safety Features](#-safety-features)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Why Autopilot?

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

- **🧠 Smart Commits**: Generates professional conventional commit messages automatically.
- **⚡ Watcher Engine**: Real-time file monitoring with smart debouncing using `chokidar`.
- **🛡️ Safety First**: Blocks commits on protected branches and checks remote status.
- **🔄 Automated Flow**: Fetches, stages, commits, and pushes (optional) automatically.
- **⚙️ Zero Config**: Works out of the box, but fully configurable via `.autopilotrc.json`.
- **🩺 Self-Healing**: Includes a `doctor` command to diagnose and fix issues.

---

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g autopilot-cli
```

### Usage

```bash
# 1. Initialize in your project
cd my-project
autopilot init

# 2. Start the background watcher
autopilot start

# 3. Check status
autopilot status

# 4. Stop when done
autopilot stop
```

---

## 💻 Commands

| Command | Description |
|---------|-------------|
| `autopilot init` | Initializes configuration and ignore files in the current directory. |
| `autopilot start` | Starts the background watcher daemon. |
| `autopilot stop` | Stops the running watcher daemon. |
| `autopilot status` | Shows the current status of the watcher process. |
| `autopilot doctor` | Runs diagnostics to verify environment and configuration. |
| `autopilot --help` | Displays help information. |

---

## ⚙️ Configuration

Autopilot uses a `.autopilotrc.json` file for configuration.

```json
{
  "minInterval": 30,
  "autoPush": true,
  "blockedBranches": ["main", "production"],
  "requireChecks": false,
  "ignore": [
    "*.log",
    "temp/",
    "dist/",
    "node_modules"
  ]
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minInterval` | `number` | `30` | Minimum seconds between commits. |
| `autoPush` | `boolean` | `true` | Whether to push changes automatically after commit. |
| `blockedBranches` | `array` | `[]` | List of branches to disable auto-commit on. |
| `requireChecks` | `boolean` | `false` | Run custom checks before committing. |
| `ignore` | `array` | `[]` | Additional glob patterns to ignore. |

---

## 🛡️ Safety Features

Autopilot includes several safety mechanisms to prevent accidents:

1.  **Branch Protection**: Will not run on branches listed in `blockedBranches`.
2.  **Remote Sync**: Checks if local branch is behind remote before acting.
3.  **Debouncing**: Waits for file changes to settle before committing.
4.  **PID Management**: Ensures only one instance runs per repository.

---

## 🔧 Troubleshooting

If you encounter issues, run the doctor command:

```bash
autopilot doctor
```

This will check for:
- Git repository status
- Configuration validity
- Node.js version
- Permissions

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <b>Built with ❤️ by <a href="https://github.com/PraiseTechzw">Praise Masunga (PraiseTechzw)</a></b>
</div>
