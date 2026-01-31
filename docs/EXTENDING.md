# Extending Autopilot - Plugin Architecture Guide

**Built by Praise Masunga (PraiseTechzw)**

Learn how to extend Autopilot with custom hooks, plugins, and integrations.

---

## OVERVIEW

Autopilot is designed for extensibility. Instead of modifying core code, extend via:

1. **Hooks** - Run custom commands before/after commits
2. **Plugins** - Programmatic extensions via API
3. **Custom Commit Message Generators** - Smart message logic
4. **Ignore Patterns** - Dynamic exclusions
5. **Git Integrations** - GitHub, GitLab, Gitea

---

## 1. HOOKS SYSTEM

### Pre-Commit Hook

Run validation before committing.

**Configuration:**
```json
{
  "hooks": {
    "preCommit": "npm run lint && npm run test"
  }
}
```

**Behavior:**
```
File changes detected
    ↓
Run: npm run lint
    ↓ (if passes)
Run: npm run test
    ↓ (if passes)
Execute: git commit
    ↓ (else)
Skip commit, log error
```

**Use Cases:**
- Linting validation
- Unit test requirements
- Security scans
- Type checking

### Post-Commit Hook

Run actions after successful commit.

**Configuration:**
```json
{
  "hooks": {
    "postCommit": "npm run build"
  }
}
```

**Use Cases:**
- Build artifacts
- Generate documentation
- Sync files
- Notifications

### Post-Push Hook

Run actions after successful push.

**Configuration:**
```json
{
  "hooks": {
    "postPush": "npm run deploy && slack --message 'Deployed!'"
  }
}
```

**Use Cases:**
- Deploy to staging
- Trigger CI/CD pipelines
- Update issue trackers
- Send notifications

### Hook Timeout

Add timeout to prevent hanging:

```json
{
  "hooks": {
    "preCommit": "npm run lint -- --max-warnings 0",
    "preCommitTimeoutSec": 30
  }
}
```

---

## 2. PROGRAMMATIC API

Use Autopilot as a library in your own tools.

### Installation (Local)
```bash
npm install ./autopilot-cli  # or git clone
```

### Basic Usage

```javascript
const autopilot = require('autopilot-cli');

// Load configuration
const config = autopilot.loadConfig(process.cwd());

// Create watcher instance
const watcher = new autopilot.Watcher(config);

// Start watching
await watcher.start();

// Listen for events
watcher.on('fileChanged', (filepath) => {
  console.log(`File: ${filepath}`);
});

watcher.on('commit', (message) => {
  console.log(`Committed: ${message}`);
});

watcher.on('error', (error) => {
  console.error(`Error: ${error}`);
});
```

### Advanced: Custom Commit Logic

```javascript
const { GitExecutor, CommitEngine } = require('autopilot-cli');

async function customCommit(repoPath, files) {
  const git = new GitExecutor();
  const engine = new CommitEngine(config);
  
  // Custom message generation
  const message = generateCustomMessage(files);
  
  // Execute
  await git.stageAll(repoPath);
  await git.commit(repoPath, message);
  await git.push(repoPath, 'origin');
}
```

### Full API Reference

```javascript
// Config
autopilot.loadConfig(path)
autopilot.validateConfig(config)
autopilot.mergeConfigs(defaults, custom)

// Git Operations
autopilot.git.commit(repo, message)
autopilot.git.push(repo, branch)
autopilot.git.status(repo)
autopilot.git.getCurrentBranch(repo)
autopilot.git.hasChanges(repo)

// Daemon
autopilot.daemon.isRunning()
autopilot.daemon.savePid(pid)
autopilot.daemon.readPid()

// Logger
autopilot.logger.info(message)
autopilot.logger.warn(message)
autopilot.logger.error(message)
autopilot.logger.debug(message)
```

---

## 3. CUSTOM COMMIT MESSAGE GENERATOR

Override message generation logic.

### Hook-Based (Simple)

Use a script to generate messages:

```json
{
  "hooks": {
    "preCommit": "node scripts/generate-message.js > /tmp/commit-msg.txt"
  }
}
```

### Plugin-Based (Advanced)

Create a custom generator plugin:

**File: `src/plugins/semantic-message-generator.js`**
```javascript
/**
 * Semantic commit message generator
 * @param {string[]} files - Changed files
 * @param {string} branch - Current branch
 * @returns {string} Commit message
 */
function generateMessage(files, branch) {
  // Extract ticket number from branch
  // e.g., feature/PROJ-123-title → PROJ-123
  const ticketMatch = branch.match(/[A-Z]+-\d+/);
  const ticket = ticketMatch ? ticketMatch[0] : '';
  
  // Categorize files
  const categories = categorizeFiles(files);
  
  // Build semantic message
  let message = '';
  if (categories.feature) message = 'feat: new feature';
  if (categories.fix) message = 'fix: bug fix';
  if (categories.docs) message = 'docs: documentation';
  
  if (ticket) {
    message += ` (${ticket})`;
  }
  
  return message;
}

function categorizeFiles(files) {
  return {
    feature: files.some(f => f.includes('src/')),
    fix: files.some(f => f.includes('fix/')),
    docs: files.some(f => f.includes('docs/'))
  };
}

module.exports = { generateMessage };
```

Register in `.autopilotrc.json`:
```json
{
  "plugins": {
    "messageGenerator": "./src/plugins/semantic-message-generator.js"
  }
}
```

---

## 4. CUSTOM SAFETY CHECKS

Add project-specific safety rules.

### Hook-Based Safety

```json
{
  "hooks": {
    "preCommit": "node scripts/safety-checks.js"
  }
}
```

**File: `scripts/safety-checks.js`**
```javascript
const fs = require('fs');
const path = require('path');

// Check for console.log statements
const files = require('child_process')
  .execSync('git diff --cached --name-only')
  .toString()
  .split('\n')
  .filter(Boolean);

let hasLogs = false;
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('console.log')) {
    console.error(`❌ Found console.log in ${file}`);
    hasLogs = true;
  }
}

if (hasLogs) {
  process.exit(1);  // Prevent commit
}

console.log('✓ All safety checks passed');
process.exit(0);
```

---

## 5. IGNORE PATTERNS

### Static Patterns (.autopilotignore)

```
# Project-specific
coverage/
__pycache__/
*.generated.js

# Sensitive
.env.production
.env.*.production
secrets/
credentials/

# Temporary
tmp/
temp/
.cache/
```

### Dynamic Patterns (from Code)

```javascript
// In your application
const ignorePatterns = require('./src/config/ignore-patterns');

function getProjectIgnores() {
  return [
    'node_modules/',
    'dist/',
    `.env.${process.env.NODE_ENV}`,
    'coverage/',
    // Add dynamic patterns
    ...(process.env.IGNORE_PATTERNS?.split(',') || [])
  ];
}
```

---

## 6. GITHUB INTEGRATION

### Action: Auto-Commit on Push

Trigger Autopilot from GitHub Actions:

**File: `.github/workflows/autopilot.yml`**
```yaml
name: Autopilot Commit

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  commit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Autopilot
        run: npm install -g autopilot-cli
      
      - name: Run Autopilot
        run: autopilot start --daemon=false --run-once
      
      - name: Push Changes
        run: |
          git config user.name "Autopilot Bot"
          git config user.email "autopilot@example.com"
          git push
```

### Action: Validate on Pull Request

```yaml
name: Validate Autopilot Config

on:
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npx autopilot doctor
```

---

## 7. GITLAB INTEGRATION

### CI: Auto-Commit Pipeline

**File: `.gitlab-ci.yml`**
```yaml
autopilot_commit:
  stage: build
  script:
    - npm install -g autopilot-cli
    - autopilot init
    - autopilot start --run-once
    - git config user.name "Autopilot Bot"
    - git config user.email "autopilot@example.com"
    - git push
  only:
    - schedules
```

---

## 8. SLACK NOTIFICATIONS

### Post-Commit Notification

**File: `scripts/notify-slack.js`**
```javascript
const https = require('https');

function notifySlack(message, branch) {
  const webhook = process.env.SLACK_WEBHOOK;
  if (!webhook) return;
  
  const payload = JSON.stringify({
    text: `Autopilot committed on ${branch}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Autopilot*\n${message}`
        }
      }
    ]
  });
  
  const url = new URL(webhook);
  const req = https.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  req.write(payload);
  req.end();
}

module.exports = { notifySlack };
```

Hook in `.autopilotrc.json`:
```json
{
  "hooks": {
    "postCommit": "node scripts/notify-slack.js"
  }
}
```

---

## 9. DOCKER INTEGRATION

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Autopilot
RUN npm install -g autopilot-cli

# Copy repo
COPY . .

# Initialize
RUN autopilot init

# Run
CMD ["autopilot", "start"]
```

### Docker Compose

```yaml
version: '3.9'

services:
  autopilot:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - AUTOPILOT_AUTO_PUSH=true
      - AUTOPILOT_LOG_LEVEL=debug
    restart: unless-stopped
```

---

## 10. EXAMPLE: MONOREPO SUPPORT

Handle multiple packages:

**File: `.autopilotrc.json`**
```json
{
  "hooks": {
    "preCommit": "npm run workspace:lint && npm run workspace:test",
    "postCommit": "npm run workspace:build"
  },
  "commitMessageMode": "smart"
}
```

**File: `scripts/generate-monorepo-message.js`**
```javascript
function generateMessage(files) {
  // Group files by workspace
  const workspaces = groupByWorkspace(files);
  const names = Object.keys(workspaces);
  
  if (names.length === 1) {
    return `chore(${names[0]}): update`;
  }
  
  return `chore(workspaces): update ${names.join(', ')}`;
}

function groupByWorkspace(files) {
  const groups = {};
  for (const file of files) {
    const match = file.match(/packages\/([^/]+)/);
    const ws = match ? match[1] : 'root';
    groups[ws] = (groups[ws] || 0) + 1;
  }
  return groups;
}

module.exports = { generateMessage };
```

---

## BEST PRACTICES FOR EXTENSIONS

1. **Keep Hooks Fast** - Long hooks delay commits
2. **Fail Loudly** - Clear error messages
3. **Use Exit Codes** - 0 = success, 1+ = failure
4. **Log Output** - Help users debug
5. **Document Changes** - Update README/ARCHITECTURE.md
6. **Test Thoroughly** - Avoid breaking productions
7. **Version Constraints** - Specify Node.js version requirements
8. **Error Handling** - Graceful degradation
9. **Configuration** - Make everything configurable
10. **Performance** - Monitor resource usage

---

## TESTING EXTENSIONS

### Test Hook Script

```bash
# Test preCommit hook
npm run lint && npm run test

# Test postCommit hook
npm run build

# Verify exit codes
echo $?
```

### Test Programmatic API

```javascript
const autopilot = require('autopilot-cli');

async function testApi() {
  const config = autopilot.loadConfig(process.cwd());
  console.log('Config loaded:', config);
  
  const git = new autopilot.git.GitExecutor();
  const branch = await git.getCurrentBranch(process.cwd());
  console.log('Branch:', branch);
}

testApi().catch(console.error);
```

---

## CONTRIBUTION GUIDELINES

Want to contribute to Autopilot core?

1. Fork: `github.com/praisetechzw/autopilot-cli`
2. Branch: `git checkout -b feature/your-idea`
3. Code: Follow [ARCHITECTURE.md](./ARCHITECTURE.md)
4. Test: `npm test` with 80%+ coverage
5. Docs: Update relevant markdown files
6. Submit: Create pull request

---

## TROUBLESHOOTING EXTENSIONS

### Hook Not Executing
```bash
autopilot doctor
# Check: preCommit command is valid
```

### Hook Timing Out
```json
{
  "preCommitTimeoutSec": 60
}
```

### Plugin Import Error
```javascript
// Absolute path
const plugin = require('/absolute/path/to/plugin.js');

// or relative to repo root
const plugin = require('./src/plugins/custom.js');
```

### State Not Persisting
```bash
# Check daemon state file
cat ~/.autopilot/state.json
```

---

**Last Updated:** January 31, 2026  
**Maintained by:** Praise Masunga (PraiseTechzw)  
**Contributing:** See CONTRIBUTING.md
