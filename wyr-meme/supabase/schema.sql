-- Would You Rather: Meme Edition — Supabase schema
-- The server writes here (service-role key) when SUPABASE_URL is set. Forum/news state
-- is also kept in server/data/board.json so the app works with no database at all.

create table if not exists votes (
  id bigint generated always as identity primary key,
  session_id text not null,
  round int not null,
  matchup_id text not null,
  side text not null check (side in ('left','right')),
  coin text not null,
  created_at timestamptz default now(),
  unique (session_id, round)            -- double-vote protection at the DB level too
);
create index if not exists votes_coin_day on votes (coin, created_at);

create table if not exists rounds (
  id bigint generated always as identity primary key,
  round int not null,
  matchup_id text not null,
  winner text not null,
  left_votes int not null,
  right_votes int not null,
  ended_at timestamptz default now()
);

create table if not exists users (
  session_id text primary key,
  display_name text,
  emoji text,
  favorite_coin text,
  wallet text,
  created_at timestamptz default now()
);

create table if not exists posts (
  id text primary key,
  title text not null,
  category text not null,
  author text,
  flair text,
  body text,
  score int default 1,
  created_at timestamptz default now()
);

create table if not exists comments (
  id text primary key,
  post_id text references posts(id) on delete cascade,
  parent_id text references comments(id) on delete cascade,
  author text,
  flair text,
  body text not null,
  score int default 1,
  created_at timestamptz default now()
);

create table if not exists coin_submissions (
  id bigint generated always as identity primary key,
  name text, ticker text, chain text, contract text, why text, at bigint,
  created_at timestamptz default now()
);

-- Most-voted coins today (for a DB-backed leaderboard)
create or replace view coin_votes_today as
  select coin, count(*) as votes from votes
  where created_at >= date_trunc('day', now())
  group by coin order by votes desc;

alter table votes enable row level security;
alter table rounds enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
create policy "public read rounds" on rounds for select using (true);
create policy "public read posts" on posts for select using (true);
create policy "public read comments" on comments for select using (true);
