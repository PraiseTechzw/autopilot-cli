# Contributing

## Setup

Install dependencies with `pnpm install`, copy `.env.example` to `.env` if testing AI or local services, and never commit secrets.

## Before opening a pull request

Run `pnpm run typecheck`, the CLI test suite, and builds for the docs and API packages. Keep changes focused and include tests for CLI behaviour changes.

## Safety

Do not test automatic commits in this repository or a valuable project. Use a disposable Git repository. Do not add API keys, GitHub tokens, or production service-role keys to fixtures, docs, or commits.
