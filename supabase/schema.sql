-- QueueUp PH — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query),
-- against a fresh project. Safe to re-run: uses "if not exists" throughout.

create extension if not exists "uuid-ossp";

-- 1. Sessions -----------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  court_count int not null default 4,
  game_format text not null default 'Race to 11, win by 2',
  active boolean not null default true
);

-- 2. Courts ---------------------------------------------------------------
create table if not exists courts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  court_number int not null,
  status text not null default 'open' check (status in ('open', 'in_progress')),
  team_a jsonb,
  team_b jsonb,
  started_at timestamptz
);

-- 3. Players ----------------------------------------------------------------
create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  name text not null,
  skill_level text not null check (skill_level in ('Beginner', 'Intermediate', 'Advanced')),
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'resting', 'checked_out')),
  checked_in_at timestamptz not null default now(),
  wins int not null default 0,
  games_played int not null default 0,
  court_id uuid references courts(id) on delete set null
);

-- 4. Matches (history of completed games, for the leaderboard/record) -------
create table if not exists matches (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  court_id uuid not null references courts(id) on delete cascade,
  team_a jsonb not null,
  team_b jsonb not null,
  winner text check (winner in ('A', 'B')),
  ended_at timestamptz default now()
);

-- Helpful indexes -----------------------------------------------------------
create index if not exists players_session_idx on players(session_id);
create index if not exists players_status_idx on players(session_id, status);
create index if not exists courts_session_idx on courts(session_id);
create index if not exists matches_session_idx on matches(session_id);

-- Row Level Security ----------------------------------------------------
-- No player accounts: the organizer authenticates with a PIN checked by the
-- /api/verify-pin server route, and every write goes through the browser's
-- anon key. Keep RLS enabled with permissive policies scoped to anon so the
-- app works, while still blocking access to any other tables you may add.
alter table sessions enable row level security;
alter table players enable row level security;
alter table courts enable row level security;
alter table matches enable row level security;

drop policy if exists "anon full access sessions" on sessions;
create policy "anon full access sessions" on sessions
  for all using (true) with check (true);

drop policy if exists "anon full access players" on players;
create policy "anon full access players" on players
  for all using (true) with check (true);

drop policy if exists "anon full access courts" on courts;
create policy "anon full access courts" on courts
  for all using (true) with check (true);

drop policy if exists "anon full access matches" on matches;
create policy "anon full access matches" on matches
  for all using (true) with check (true);

-- Realtime --------------------------------------------------------------
-- Enable replication so /queue and /leaderboard update live. In the
-- Supabase dashboard: Database > Replication > toggle "sessions",
-- "players", "courts" and "matches" on, or run:
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table courts;
alter publication supabase_realtime add table matches;
