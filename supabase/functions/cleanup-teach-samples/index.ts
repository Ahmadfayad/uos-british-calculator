// Deletes certificate pages attached to taught rules once they are older than the
// retention period (30 days). Pages are normally deleted when an admin approves or
// rejects the rule; this removes any that were left behind.
//
// - Scheduled daily run (no body): deletes pages older than 30 days. Harmless, so no sign-in.
// - Manual run from the Admin panel ({ days: 0-30 }): admins only (checked below).
import { createClient } from 'npm:@supabase/supabase-js@2';

const RETENTION_DAYS = 30;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));
  let days = RETENTION_DAYS;

  if (body && body.days !== undefined) {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await db.auth.getUser(token);
    const userId = auth?.user?.id;
    const { data: admins } = userId
      ? await db.from('ocr_admins').select('user_id').eq('user_id', userId)
      : { data: [] as unknown[] };
    if (!admins || admins.length === 0) return json({ error: 'admins only' }, 403);
    days = Math.max(0, Math.min(RETENTION_DAYS, Math.floor(Number(body.days))));
    if (!Number.isFinite(days)) days = RETENTION_DAYS;
  }

  const cutoff = Date.now() - days * 86_400_000;
  const old: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.storage.from('teach-samples').list('', { limit: 1000, offset, sortBy: { column: 'created_at', order: 'asc' } });
    if (error) return json({ error: error.message }, 500);
    if (!data || data.length === 0) break;
    for (const o of data) if (o.created_at && new Date(o.created_at).getTime() <= cutoff) old.push(o.name);
    if (data.length < 1000) break;
  }

  let deleted = 0;
  for (let i = 0; i < old.length; i += 100) {
    const batch = old.slice(i, i + 100);
    const { error } = await db.storage.from('teach-samples').remove(batch);
    if (error) return json({ error: error.message, deleted }, 500);
    await db.from('ocr_rules').update({ sample_path: null }).in('sample_path', batch);
    deleted += batch.length;
  }
  return json({ deleted, olderThanDays: days });
});
