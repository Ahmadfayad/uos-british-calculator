-- UOS British Calculator: shared reading rules for the certificate reader.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Rules hold layout patterns and subject spellings only, never student names,
-- marks or documents. Anyone using the calculator can suggest a rule (it is
-- saved as "pending"); only admins listed in ocr_admins can approve, reject
-- or remove rules, and only approved rules are used by everyone.

create table if not exists public.ocr_rules (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('alias', 'layout')),
  level       text not null check (level in ('o-level', 'as-level', 'a-level', 'moe')),
  pattern     text not null check (char_length(pattern) between 1 and 300),
  subject     text check (char_length(subject) <= 120),
  keywords    text check (char_length(keywords) <= 200),
  example     text check (char_length(example) <= 300),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.ocr_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.ocr_rules  enable row level security;
alter table public.ocr_admins enable row level security;

-- Helper: is the signed-in user an admin?
create or replace function public.is_ocr_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.ocr_admins where user_id = auth.uid());
$$;

-- Everyone reads approved rules; admins read everything.
drop policy if exists "read rules" on public.ocr_rules;
create policy "read rules" on public.ocr_rules for select to anon, authenticated
  using (status = 'approved' or public.is_ocr_admin());

-- Everyone may suggest a rule, but only as pending.
drop policy if exists "suggest rules" on public.ocr_rules;
create policy "suggest rules" on public.ocr_rules for insert to anon, authenticated
  with check (status = 'pending' and approved_at is null);

-- Only admins approve, reject or remove.
drop policy if exists "admins update rules" on public.ocr_rules;
create policy "admins update rules" on public.ocr_rules for update to authenticated
  using (public.is_ocr_admin()) with check (public.is_ocr_admin());

drop policy if exists "admins delete rules" on public.ocr_rules;
create policy "admins delete rules" on public.ocr_rules for delete to authenticated
  using (public.is_ocr_admin());

-- An admin can see their own admin entry (used to confirm admin sign-in).
drop policy if exists "admins see themselves" on public.ocr_admins;
create policy "admins see themselves" on public.ocr_admins for select to authenticated
  using (user_id = auth.uid());

-- ── Make yourself an admin ──
-- 1. Dashboard → Authentication → Users → Add user → create your admin account
--    (email + password; tick "Auto Confirm User").
-- 2. Then run (with your admin email):
--
--   insert into public.ocr_admins (user_id)
--   select id from auth.users where email = 'your.admin@example.com';
