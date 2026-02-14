create table if not exists public.leaderboard (
  id text primary key,
  username text not null,
  score numeric not null default 0,
  commits integer not null default 0,
  focus_minutes integer not null default 0,
  streak integer not null default 0,
  last_active timestamptz not null default now()
);

create index if not exists idx_leaderboard_score on public.leaderboard (score desc);
create index if not exists idx_leaderboard_last_active on public.leaderboard (last_active desc);

alter table public.leaderboard enable row level security;
create policy "leaderboard_select_public" on public.leaderboard
  for select
  to anon, authenticated
  using (true);
create policy "leaderboard_insert_service" on public.leaderboard
  for insert
  to service_role
  with check (true);
create policy "leaderboard_update_service" on public.leaderboard
  for update
  to service_role
  using (true)
  with check (true);
grant select on public.leaderboard to anon, authenticated;

create table if not exists public.events (
  id bigserial primary key,
  type text not null,
  user_id text,
  commit_hash text,
  timestamp bigint,
  version text,
  queued_at bigint,
  retry_count integer,
  received_at timestamptz not null default now()
);

create index if not exists idx_events_type on public.events (type);
create index if not exists idx_events_user on public.events (user_id);
create index if not exists idx_events_received_at on public.events (received_at desc);

alter table public.events enable row level security;
create policy "events_insert_service" on public.events
  for insert
  to service_role
  with check (true);
create policy "events_select_service" on public.events
  for select
  to service_role
  using (true);
