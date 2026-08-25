# Autopilot release notes

## Release 4.0.2 — Dashboard, telemetry, and VS Code workflow

This release expands Autopilot from a terminal Git automation utility into a connected developer workflow spanning the CLI dashboard, Supabase telemetry, the VS Code editor, and the public documentation site.

### CLI and dashboard

The CLI entry points now use controlled asynchronous error propagation. Dashboard startup failures are surfaced cleanly and return a non-zero process status instead of becoming uncaught or silent failures. The terminal dashboard has been redesigned as an information-dense control center with repository health, branch state, watcher status, pending changes, recent activity, daily commit statistics, refresh timing, and explicit degraded-state messaging.

The dashboard includes an interactive settings view. Users can navigate settings with the keyboard and persist Auto Push, Team Mode, notifications, secret scanning, debounce delay, commit cooldown, and telemetry alert preferences through `.autopilotrc.json`.

### Supabase telemetry

Telemetry is sourced from the Supabase `public.events` table. The client performs an initial five-minute snapshot query, subscribes to Realtime `INSERT` events, calculates event totals and events-per-minute, and exposes explicit connection states. It does not fabricate metrics or silently fall back to local values when Supabase is unavailable.

Users can export the exact Supabase snapshot as JSON or CSV:

```bash
autopilot telemetry export --format json --output telemetry.json
autopilot telemetry export --format csv --output telemetry.csv
```

Threshold alerts are available for total events and events per minute. Conditions are de-duplicated, rendered in the dashboard, and sent through the existing desktop notification abstraction. The release also includes deterministic Realtime simulation tests and an idempotent SQL migration for the events table, indexes, policies, grants, and Realtime publication membership.

### VS Code extension

The new `PraiseTechzw.praisetechzw-autopilot` extension adds a live Autopilot sidebar, integrated output logs, status-bar state, quick actions for watcher control and undo, and a form-based settings editor. The sidebar includes Supabase telemetry state, event totals, rate, latest event, and threshold alerts. The package is published as `praisetechzw-autopilot` and uses Marketplace-compatible PNG branding.

### Website and documentation

The website now has stronger site-wide metadata, configurable canonical URLs through `NEXT_PUBLIC_SITE_URL`, Open Graph and Twitter cards, Organization/WebSite/SoftwareApplication structured data, per-document TechArticle metadata, a crawlable leaderboard route, duplicate-free sitemap entries, and consistent robots configuration. The landing page highlights the VS Code extension and the footer links to the scoped npm package.

Documentation now covers extension installation, Marketplace and npm publication, Supabase migration, telemetry exports, release workflows, and the required secrets without storing credentials in the repository.

### Verification

The clean CLI regression suite passes with 112 tests and 0 failures. Extension manifest and syntax checks pass, the VSIX package builds successfully, and the website production build passes. The website lint command still reports pre-existing issues in existing components; those do not block the production build.

### Upgrade notes

Set `NEXT_PUBLIC_SITE_URL` to the real production domain before deploying the website. For telemetry, configure a valid Supabase URL and key, apply the events migration, and enable Realtime for `public.events`. For Marketplace publishing, configure the `VSCE_PAT` GitHub secret for the `PraiseTechzw` publisher. Never commit `.env.local`, Supabase service-role keys, Marketplace tokens, or npm tokens.
