# Autopilot CLI

**Built by Praise Masunga (PraiseTechzw)**  
**GitHub:** [github.com/praisetechzw/autopilot-cli](https://github.com/praisetechzw/autopilot-cli)

An intelligent, production-grade Git automation CLI that intelligently commits and pushes your code changes, so you can focus on building. Designed with safety, maintainability, and extensibility in mind.

---

## ✨ Features

- 🚀 **Automatic Commits** - Intelligently commits file changes based on configurable rules
- 🛡️ **Safety-First** - Protected branches, conflict detection, sensitive file blocking
- ⚡ **Smart Messages** - Context-aware conventional commit messages
- 🔌 **Extensible** - Hooks, plugins, and custom generators
- 🔄 **Process Management** - Daemon mode with PID tracking and graceful shutdown
- 📊 **Comprehensive Logging** - Structured logs with multiple levels and formats
- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 🏗️ **Monorepo Ready** - Full support for multi-package repositories

---

## Quick Start

### Installation

```bash
npm install -g autopilot-cli
```

### Basic Usage

```bash
# Initialize in a git repository
cd my-project
autopilot init

# Start watching for changes
autopilot start

# Check status
autopilot status

# Stop watching
autopilot stop
```

---

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize Autopilot configuration in current repo |
| `start` | Start the file watcher and auto-commit daemon |
| `stop` | Stop the running daemon |
| `status` | Show daemon status and configuration |
| `doctor` | Diagnose issues and validate setup |

---

## Configuration

Create `.autopilotrc.json` in your repository root:

```json
{
  "watchDebounceMs": 2000,
  "minCommitIntervalSec": 60,
  "autoPush": false,
  "protectedBranches": ["main", "master"],
  "commitMessageMode": "smart",
  "safety": {
    "checkLargeFiles": true,
    "maxFileSizeKb": 100,
    "detectSensitiveFiles": true,
    "checkForConflicts": true
  }
}
```

See [CONFIGURATION.md](./docs/CONFIGURATION.md) for complete reference.

---

## Safety Features

Autopilot includes multiple safety mechanisms:

- ✅ **Protected Branches** - Refuses commits on main/master
- ✅ **Large File Detection** - Blocks files exceeding size limits
- ✅ **Sensitive File Detection** - Prevents secrets from being committed
- ✅ **Conflict Detection** - Pauses on merge conflicts
- ✅ **Branch Tracking** - Verifies upstream configuration
- ✅ **Commit Rate Limiting** - Prevents spam commits
- ✅ **Pre-commit Hooks** - Custom validation before commits

See [SAFETY-FEATURES.md](./docs/SAFETY-FEATURES.md) for complete details.

---

## Architecture

Autopilot follows a clean, layered architecture designed for maintainability and extensibility:

```
CLI Layer (commands) 
    ↓
Core Layer (business logic)
    ↓
Config Layer (configuration)
    ↓
Daemon Layer (process management)
    ↓
Utils Layer (pure functions)
```

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the complete design document.

---

## Extending Autopilot

### Hooks

Add custom logic via hooks:

```json
{
  "hooks": {
    "preCommit": "npm run lint",
    "postCommit": "npm run build",
    "postPush": "npm run deploy"
  }
}
```

### Plugins

Create custom commit message generators, safety checks, and more.

See [EXTENDING.md](./docs/EXTENDING.md) for a complete guide.

---

## Requirements

- **Node.js:** >= 18.0.0
- **Git:** 2.0 or higher
- **OS:** Linux, macOS, Windows (WSL recommended)

---

## Installation Methods

### npm (Global)
```bash
npm install -g autopilot-cli
autopilot --version
```

### npm (Local)
```bash
npm install --save-dev autopilot-cli
npx autopilot init
```

### Manual
```bash
git clone https://github.com/praisetechzw/autopilot-cli.git
cd autopilot-cli
npm install
npm link
autopilot --version
```

---

## Usage Examples

### Simple Auto-Commit

```bash
autopilot init
autopilot start
# Now all changes are automatically committed!
```

### With Auto-Push

```json
{
  "autoPush": true,
  "protectedBranches": ["main"]
}
```

### Monorepo Setup

```json
{
  "hooks": {
    "preCommit": "npm run workspace:lint && npm run workspace:test",
    "postCommit": "npm run workspace:build"
  }
}
```

### CI/CD Integration

See [EXTENDING.md](./docs/EXTENDING.md) for GitHub Actions, GitLab CI, and more.

---

## Troubleshooting

### Autopilot won't start
```bash
autopilot doctor
```

This diagnoses common issues including:
- Git repository validation
- Config file errors
- Large files blocking commits
- Sensitive file detection

### Review logs
```bash
tail -f ~/.autopilot/autopilot.log
```

---

## Project Structure

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for a complete folder structure and responsibilities.

Key directories:
- `bin/` - CLI executable
- `src/cli/` - Command implementations
- `src/core/` - Business logic
- `src/config/` - Configuration management
- `src/daemon/` - Process lifecycle
- `src/safety/` - Validation & safety checks
- `docs/` - Complete documentation

---

## Contributing

Autopilot welcomes contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

To report bugs or request features, open an issue on [GitHub](https://github.com/praisetechzw/autopilot-cli/issues).

---

## Development

### Setup
```bash
git clone https://github.com/praisetechzw/autopilot-cli.git
cd autopilot-cli
npm install
npm run dev  # or: node bin/autopilot.js
```

### Testing
```bash
npm test          # Run all tests
npm run test:unit # Unit tests only
npm run test:integration # Integration tests
```

### Linting
```bash
npm run lint
npm run lint:fix
```

---

## Support

- 📖 **Documentation:** [docs/](./docs/) directory
- 🐛 **Issues:** [GitHub Issues](https://github.com/praisetechzw/autopilot-cli/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/praisetechzw/autopilot-cli/discussions)
- 📧 **Email:** praise@praisetechzw.dev

---

## License

MIT License - Copyright (c) 2026 Praise Masunga (PraiseTechzw)

See [LICENSE](./LICENSE) for full details.

---

## Roadmap

### Phase 1 (Current)
- ✅ Core commands (init, start, stop, status)
- ✅ Basic safety checks
- ✅ Configuration system
- ✅ Process management

### Phase 2 (Planned)
- 🔄 Hook system (pre/post commit)
- 🔄 Plugin architecture
- 🔄 Custom generators
- 🔄 Advanced logging

### Phase 3 (Future)
- 📅 Webhook integrations
- 📅 Slack notifications
- 📅 GitHub/GitLab API integration
- 📅 Conditional logic

---

## Acknowledgments

Autopilot builds on the shoulders of excellent open-source projects:
- [chokidar](https://github.com/paulmillr/chokidar) - File system watcher
- [commander.js](https://github.com/tj/commander.js) - CLI framework
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - File system utilities

---

**Built with ❤️ by Praise Masunga (PraiseTechzw)**

⭐ If you find Autopilot useful, please star the [repository](https://github.com/praisetechzw/autopilot-cli)!
