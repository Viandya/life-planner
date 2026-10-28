// Три жизни: вход через Telegram Mini App.
// Проверяет подпись initData токеном бота @Viandya_bot, находит пользователя (свой профиль или аккаунт Duo)
// или создаёт его тем же способом, что Duo, и выдаёт сессию Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let TOKEN: string | null = null;
async function botToken() {
  if (TOKEN) return TOKEN;
  const { data, error } = await admin.rpc('lp_bot_token');
  if (error || !data) throw error ?? new Error('no token');
  return (TOKEN = data as string);
}

const enc = new TextEncoder();
async function hmac(key: ArrayBuffer | Uint8Array, msg: string) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

async function verify(initData: string) {
  if (!initData) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const check = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac(enc.encode('WebAppData'), await botToken());
  if (hex(await hmac(secret, check)) !== hash) return null;
  const auth = Number(p.get('auth_date'));
  if (!auth || Date.now() / 1000 - auth > 86400) return null;
  const user = JSON.parse(p.get('user') || 'null');
  return user?.id ? user : null;
}

async function sessionFor(email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  const pub = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: v, error: vErr } = await pub.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: 'magiclink' });
  if (vErr || !v.session) throw vErr ?? new Error('no session');
  return v.session;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const { initData } = await req.json();
    const tg = await verify(initData ?? '');
    if (!tg) return json({ error: 'invalid' }, 401);

    let email: string | undefined;
    const { data: existing } = await admin.rpc('lp_find_user', { p_tg: tg.id });
    if (existing) {
      const { data: u } = await admin.auth.admin.getUserById(existing as string);
      email = u?.user?.email ?? undefined;
    }
    if (!email) {
      email = `tg${tg.id}@telegram.duo`; // тот же формат, что в Duo: один аккаунт на оба приложения
      const lang = String(tg.language_code || '').startsWith('en') ? 'en' : 'ru';
      const { error: cErr } = await admin.auth.admin.createUser({
        email, email_confirm: true,
        user_metadata: { display_name: tg.first_name || 'Я', telegram_id: tg.id, lang },
      });
      if (cErr && !/already/i.test(cErr.message)) throw cErr;
    }
    const s = await sessionFor(email);
    await admin.from('lp_state').upsert({ user_id: s.user.id, tg_id: tg.id }, { onConflict: 'user_id', ignoreDuplicates: true });
    return json({ access_token: s.access_token, refresh_token: s.refresh_token, first_name: tg.first_name || '' });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
