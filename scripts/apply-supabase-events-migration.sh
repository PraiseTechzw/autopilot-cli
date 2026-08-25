#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required. Obtain the direct database URL from Supabase project settings." >&2
  exit 2
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to apply the migration." >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION="$ROOT_DIR/supabase/migrations/202608250001_create_events_telemetry.sql"

psql "$SUPABASE_DB_URL" --set=ON_ERROR_STOP=1 --file "$MIGRATION"
echo "Supabase public.events telemetry migration applied successfully."
