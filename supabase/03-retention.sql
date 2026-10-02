-- UOS British Calculator: retention of attached certificate pages.
-- Run after 02-teach-samples-and-alerts.sql, and deploy the Edge Function in
-- supabase/functions/cleanup-teach-samples (verify_jwt off: it checks admins itself).
--
-- Pages are deleted when an admin approves or rejects a rule. In addition, a nightly
-- job deletes any page older than 30 days, and admins can clear pages sooner from
-- the Admin panel.

-- Storage use for the Admin panel (admins only).
create or replace function public.ocr_storage_stats() returns jsonb
language plpgsql stable security definer set search_path = public, storage as $$
begin
  if not private.is_ocr_admin() then raise exception 'not an admin'; end if;
  return (select jsonb_build_object(
    'files', count(*),
    'bytes', coalesce(sum((metadata->>'size')::bigint), 0),
    'oldest', min(created_at))
  from storage.objects where bucket_id = 'teach-samples');
end;
$$;
revoke all on function public.ocr_storage_stats() from public, anon;
grant execute on function public.ocr_storage_stats() to authenticated;

-- Daily clean-up at 03:00 UTC (calls the Edge Function, which deletes pages older than 30 days).
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'cleanup-teach-samples';
select cron.schedule(
  'cleanup-teach-samples',
  '0 3 * * *',
  $$ select net.http_post(
       url := 'https://vpchkmmxidjrqepghxxz.supabase.co/functions/v1/cleanup-teach-samples',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb) $$
);
