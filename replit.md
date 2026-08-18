# Autopilot CLI & Docs Platform

An intelligent Git automation CLI and interactive documentation platform with live in-browser terminal simulation, watcher diagnostics, and global productivity leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (default port 5000)
- `pnpm --filter @workspace/autopilot-docs run dev` — run the documentation website and interactive Web Tool (port 3000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec

## Stack

- pnpm workspaces, Node.js, TypeScript 5.9
- Frontend: React 19, Vite 7, TailwindCSS 4, Wouter, Lucide Icons, Framer Motion
- API: Express 5, Pino HTTP logger
- DB / Storage: PostgreSQL + Drizzle ORM / Supabase with local JSON fallback
- Markdown / MDX: ReactMarkdown, Rehype, Remark, Highlight.js

## Where things live

- `artifacts/autopilot-docs/` — Documentation website, home page, global leaderboard, and **Interactive Web Tool (`/playground`)**
- `artifacts/autopilot-docs/src/pages/Playground.tsx` — Full-featured interactive CLI terminal & live watcher simulator with dual-pane layout, editable mock files, secret scanner guard, commit graph visualizer, and productivity sync
- `artifacts/autopilot-docs/src/lib/docs-content.ts` — Offline-first centralized documentation registry containing all 17 documentation topics
- `artifacts/api-server/` — Express API server handling `/api/docs`, `/api/leaderboard`, `/api/events`, `/api/version`, and `/api/downloads`
- `lib/api-spec/` — OpenAPI specification and codegen rules

## Features & Capabilities

- **Interactive Web Tool**: Browser-based dual-pane CLI simulator with command execution (`autopilot start`, `status`, `doctor`, `insights`, `undo`, `preset`, `leaderboard`), editable file workspace, real-time debounce countdown, secret scanner guardrail, and visual Git commit tree.
- **17 Comprehensive Docs Articles**: Introduction, Installation, Quick Start, Configuration, Productivity, Safety Rails, Advanced Usage, Troubleshooting, Security, Benchmarks, Extensibility, Contributing, Changelog, Roadmap, Localization, and Accessibility.
- **Global Leaderboard**: Live productivity rankings tracking focus minutes, commit frequency, and streaks with live sync support.
