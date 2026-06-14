-- ════════════════════════════════════════════
-- Harmony database schema (run in Supabase SQL editor)
-- ════════════════════════════════════════════

-- Seniors / users
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id) on delete cascade,
  name text,
  preferred_name text,
  language text default 'en-US',
  created_at timestamptz default now(),
  -- subscription
  trial_start timestamptz default now(),
  subscribed boolean default false,
  stripe_customer_id text,
  -- care settings
  checkin_time int default 540,           -- minutes from midnight
  alert_phone text,                        -- family member to text
  alert_email text,
  last_alert_sent date
);

-- Daily check-ins
create table if not exists checkins (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) on delete cascade,
  mood text,
  created_at timestamptz default now()
);

-- Medications
create table if not exists medications (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) on delete cascade,
  name text not null,
  time int not null                        -- minutes from midnight
);

-- Medication log
create table if not exists med_log (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) on delete cascade,
  med_id bigint,
  name text,
  taken boolean,
  created_at timestamptz default now()
);

-- Activity feed (for family dashboard)
create table if not exists activity (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) on delete cascade,
  type text,                               -- checkin | medication | mood | alert | system
  detail text,
  mood text,
  created_at timestamptz default now()
);

-- Family members linked to a senior
create table if not exists family_links (
  id bigint generated always as identity primary key,
  profile_id uuid references profiles(id) on delete cascade,
  family_auth_id uuid references auth.users(id) on delete cascade,
  relation text,
  created_at timestamptz default now()
);

-- ── Row Level Security ──
alter table profiles enable row level security;
alter table checkins enable row level security;
alter table medications enable row level security;
alter table med_log enable row level security;
alter table activity enable row level security;
alter table family_links enable row level security;

-- Owner can do everything with their own profile
create policy "own profile" on profiles for all using (auth.uid() = auth_id);
create policy "own checkins" on checkins for all using (exists (select 1 from profiles p where p.id = checkins.profile_id and p.auth_id = auth.uid()));
create policy "own meds" on medications for all using (exists (select 1 from profiles p where p.id = medications.profile_id and p.auth_id = auth.uid()));
create policy "own medlog" on med_log for all using (exists (select 1 from profiles p where p.id = med_log.profile_id and p.auth_id = auth.uid()));
create policy "own activity" on activity for all using (exists (select 1 from profiles p where p.id = activity.profile_id and p.auth_id = auth.uid()));

-- Family members can READ the senior's data they're linked to
create policy "family reads profile" on profiles for select using (exists (select 1 from family_links f where f.profile_id = profiles.id and f.family_auth_id = auth.uid()));
create policy "family reads checkins" on checkins for select using (exists (select 1 from family_links f where f.profile_id = checkins.profile_id and f.family_auth_id = auth.uid()));
create policy "family reads activity" on activity for select using (exists (select 1 from family_links f where f.profile_id = activity.profile_id and f.family_auth_id = auth.uid()));

-- ── Schedule the daily missed check-in alert (uses pg_cron, free on Supabase) ──
-- Run this AFTER deploying the edge function. Replace YOUR_PROJECT_REF and YOUR_ANON_KEY.
-- select cron.schedule(
--   'missed-checkin-hourly',
--   '0 * * * *',  -- every hour on the hour
--   $$ select net.http_post(
--        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/missed-checkin-alert',
--        headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
--      ); $$
-- );
