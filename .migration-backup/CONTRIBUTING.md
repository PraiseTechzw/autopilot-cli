# Contributing to Autopilot CLI

First off, thanks for taking the time to contribute! 🎉

## How to Contribute

### Reporting Bugs
If you find a bug, please create a report using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.yml).

### Suggesting Enhancements
Have an idea? We'd love to hear it! Please submit a [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml).

### Pull Requests
1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`npm run verify`).
4. Make sure your code lints.
5. Open a Pull Request using our [PR Template](.github/pull_request_template.md).

## Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/PraiseTechzw/autopilot-cli.git
   cd autopilot-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run tests**
   ```bash
   npm run verify
   ```

## Repository Standards
- **Commits**: We follow [Conventional Commits](https://www.conventionalcommits.org/).
- **CI**: All PRs must pass the CI pipeline (lint, test, verify) before merging.
