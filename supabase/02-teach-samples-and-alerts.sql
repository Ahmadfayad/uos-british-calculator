-- UOS British Calculator: certificate pages attached to taught rules, and admin alerts.
-- Run after setup.sql (Dashboard → SQL Editor → New query → paste → Run).

-- 1. Attached certificate page (private storage path) and who taught the rule.
alter table public.ocr_rules add column if not exists sample_path text check (char_length(sample_path) <= 200);
alter table public.ocr_rules add column if not exists taught_by text check (char_length(taught_by) <= 80);

-- 2. Private bucket: anyone may upload a JPEG page; only admins may view or delete it.
--    The calculator deletes the page as soon as an admin approves or rejects the rule.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teach-samples', 'teach-samples', false, 3145728, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg'];

drop policy if exists "teach samples: upload" on storage.objects;
create policy "teach samples: upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'teach-samples' and name ~ '^[0-9a-z-]{8,80}\.jpg$');

drop policy if exists "teach samples: admins read" on storage.objects;
create policy "teach samples: admins read" on storage.objects for select to authenticated
  using (bucket_id = 'teach-samples' and private.is_ocr_admin());

drop policy if exists "teach samples: admins delete" on storage.objects;
create policy "teach samples: admins delete" on storage.objects for delete to authenticated
  using (bucket_id = 'teach-samples' and private.is_ocr_admin());

-- 3. Number of rules waiting for approval (count only) for the badge on the Admin link.
create or replace function public.ocr_pending_count() returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.ocr_rules where status = 'pending';
$$;
revoke all on function public.ocr_pending_count() from public;
grant execute on function public.ocr_pending_count() to anon, authenticated;

-- 4. Optional instant alert (e.g. a Microsoft Teams workflow link) when a rule is sent.
create extension if not exists pg_net with schema extensions;

create table if not exists private.ocr_settings (key text primary key, value text);
revoke all on private.ocr_settings from public, anon, authenticated;

create or replace function private.notify_new_ocr_rule() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  hook text;
  pending int;
  msg text;
begin
  select value into hook from private.ocr_settings where key = 'webhook_url';
  if hook is null or hook = '' then return new; end if;
  select count(*) into pending from public.ocr_rules where status = 'pending';
  msg := 'UOS British Calculator: a staff member taught the certificate reader a new '
      || case when new.kind = 'layout' then 'layout' else 'subject spelling' end
      || coalesce(' (from: ' || left(new.example, 120) || ')', '')
      || case when new.sample_path is not null then ' with the certificate page attached' else '' end
      || '. ' || pending || ' rule(s) waiting for approval. Open the calculator → Admin to review.';
  perform net.http_post(
    url := hook,
    body := jsonb_build_object(
      'text', msg,
      'type', 'message',
      'attachments', jsonb_build_array(jsonb_build_object(
        'contentType', 'application/vnd.microsoft.card.adaptive',
        'content', jsonb_build_object('type', 'AdaptiveCard', 'version', '1.4',
          '$schema', 'http://adaptivecards.io/schemas/adaptive-card.json',
          'body', jsonb_build_array(jsonb_build_object('type', 'TextBlock', 'text', msg, 'wrap', true))))))
  );
  return new;
exception when others then
  return new; -- an alert problem must never block saving the rule
end;
$$;

drop trigger if exists ocr_rules_notify on public.ocr_rules;
create trigger ocr_rules_notify after insert on public.ocr_rules
  for each row when (new.status = 'pending') execute function private.notify_new_ocr_rule();

-- 5. Admins set, clear or check the alert link from the calculator's Admin panel.
create or replace function public.set_ocr_webhook(url text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_ocr_admin() then raise exception 'not an admin'; end if;
  if url is not null and url <> '' and url !~ '^https://' then raise exception 'the link must start with https://'; end if;
  insert into private.ocr_settings (key, value) values ('webhook_url', nullif(url, ''))
  on conflict (key) do update set value = excluded.value;
  return true;
end;
$$;
revoke all on function public.set_ocr_webhook(text) from public, anon;
grant execute on function public.set_ocr_webhook(text) to authenticated;

create or replace function public.get_ocr_webhook_set() returns boolean
language sql stable security definer set search_path = public as $$
  select private.is_ocr_admin() and exists (select 1 from private.ocr_settings where key = 'webhook_url' and coalesce(value, '') <> '');
$$;
revoke all on function public.get_ocr_webhook_set() from public, anon;
grant execute on function public.get_ocr_webhook_set() to authenticated;
