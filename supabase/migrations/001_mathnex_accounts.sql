-- MATHNEX accounts, sync and entitlements.
-- Run once in Supabase Dashboard > SQL Editor (or `supabase db push`). Safe to re-run.
-- Security model: every table has Row Level Security enabled; users can only touch rows where
-- user_id = auth.uid(). The browser only ever holds the public anon key.

create extension if not exists pgcrypto;

-- 1. Profiles ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text check (char_length(display_name) <= 80),
  institution   text check (char_length(institution) <= 120),
  study_focus   text check (char_length(study_focus) <= 120),
  ads_personalised boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Saved resources (bookmarked modules) -----------------------------------------------
create table if not exists public.saved_resources (
  user_id    uuid not null references auth.users(id) on delete cascade,
  module     text not null check (module ~ '^[a-z0-9_-]{1,40}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, module)
);

-- 3. Module activity (recently accessed + visit counts) ---------------------------------
create table if not exists public.module_activity (
  user_id        uuid not null references auth.users(id) on delete cascade,
  module         text not null check (module ~ '^[a-z0-9_-]{1,40}$'),
  visit_count    integer not null default 1 check (visit_count >= 0),
  last_opened_at timestamptz not null default now(),
  primary key (user_id, module)
);

-- 4. Quiz history (best result per quiz) ------------------------------------------------
create table if not exists public.quiz_results (
  user_id    uuid not null references auth.users(id) on delete cascade,
  module     text not null check (module ~ '^[a-z0-9_-]{1,40}$'),
  quiz_id    text not null check (char_length(quiz_id) between 1 and 120),
  score      integer not null check (score >= 0),
  total      integer not null check (total > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, module, quiz_id),
  check (score <= total)
);

-- 5. Topic progress (reviewed topics / completed exercises) -----------------------------
create table if not exists public.topic_progress (
  user_id             uuid not null references auth.users(id) on delete cascade,
  module              text not null check (module ~ '^[a-z0-9_-]{1,40}$'),
  reviewed_topics     jsonb not null default '[]'::jsonb check (jsonb_typeof(reviewed_topics) = 'array' and jsonb_array_length(reviewed_topics) <= 500),
  completed_exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(completed_exercises) = 'array' and jsonb_array_length(completed_exercises) <= 500),
  updated_at          timestamptz not null default now(),
  primary key (user_id, module)
);

-- 6. Entitlements (future premium). Users can READ their own row; only the service role
--    (e.g. a payment webhook running server-side) can write it. -------------------------
create table if not exists public.entitlements (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  plan               text not null default 'free' check (plan in ('free','premium')),
  status             text not null default 'active' check (status in ('active','trialing','past_due','canceled')),
  current_period_end timestamptz,
  provider           text,
  provider_ref       text,
  updated_at         timestamptz not null default now()
);

-- Row Level Security -------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.saved_resources enable row level security;
alter table public.module_activity enable row level security;
alter table public.quiz_results    enable row level security;
alter table public.topic_progress  enable row level security;
alter table public.entitlements    enable row level security;

-- profiles: read/update own row. Insert is performed by the trigger below, so no insert policy.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user-owned data tables: full CRUD on own rows only.
do $$
declare t text;
begin
  foreach t in array array['saved_resources','module_activity','quiz_results','topic_progress'] loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s', t);
    execute format('create policy "%1$s_select_own" on public.%1$s for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s_insert_own" on public.%1$s for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s_update_own" on public.%1$s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "%1$s_delete_own" on public.%1$s for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- entitlements: read own row only (no insert/update/delete policies => clients cannot write).
drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own" on public.entitlements for select to authenticated using (user_id = (select auth.uid()));

-- Anonymous visitors get no table access at all.
revoke all on public.profiles, public.saved_resources, public.module_activity,
              public.quiz_results, public.topic_progress, public.entitlements from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_resources, public.module_activity,
              public.quiz_results, public.topic_progress to authenticated;
grant select on public.entitlements to authenticated;

-- Auto-create profile + free entitlement on sign-up -------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data->>'display_name',''), 80), ''))
  on conflict (id) do nothing;
  insert into public.entitlements (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-fill rows for users that registered before this migration ran.
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;
insert into public.entitlements (user_id) select id from auth.users on conflict (user_id) do nothing;

-- updated_at maintenance -----------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
