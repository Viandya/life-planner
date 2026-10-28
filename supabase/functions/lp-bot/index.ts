// Три жизни: Telegram-бот @Viandya_bot (webhook).
// /start — приветствие с картинкой и кнопкой приложения, /today — что сегодня, /help — подсказка.
// Обычный текст: «кофе 350» → трата, «эссе до 6.11» → дедлайн (кладём в lp_inbox, приложение забирает при открытии).
// POST {"action":"setup"} — настроить webhook, описание, команды и кнопку меню (идемпотентно).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const APP = 'https://viandya.github.io/life-planner/';
const PHOTO = APP + 'bot/welcome.jpg';
const SELF = Deno.env.get('SUPABASE_URL')! + '/functions/v1/lp-bot';
const TZ = 'Europe/Moscow';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

let TOKEN = '';
async function token() {
  if (TOKEN) return TOKEN;
  const { data, error } = await admin.rpc('lp_bot_token');
  if (error || !data) throw error ?? new Error('no token');
  return (TOKEN = data as string);
}
async function hookSecret() {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('lp:' + (await token()))));
  return [...h].map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 48);
}
async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${await token()}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) console.error(method, j);
  return j;
}
const esc = (s: string) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const openBtn = (text = 'Открыть Три жизни') => ({ text, web_app: { url: APP } });

// ---------- Тексты ----------
const DESCRIPTION = `Три жизни: личный планер для тех, кто совмещает учёбу, работу и отношения.

· Планер: баланс времени между учёбой, работой, любимым человеком и собой
· Дедлайны: шаги и подсказка, когда пора начинать
· Сессия: условия допуска, посещаемость и автоматы
· Бюджет: сколько можно тратить в день и копилка на цель

Пиши мне «кофе 350» или «эссе до 6.11», и я запишу трату или дедлайн.`;
const SHORT = 'Учёба, работа и любимый человек в одном планере: дедлайны, сессия и бюджет.';
const welcome = (name: string) => `<b>Привет${name ? ', ' + esc(name) : ''}!</b>

Я помогаю совмещать учёбу, работу и любимого человека так, чтобы ничего не проседало.

<b>Что внутри</b>
· Планер с балансом недели и перегруженными днями
· Дедлайны с шагами и подсказкой «пора начинать»
· Сессия: допуски, посещаемость, автоматы
· Бюджет: сколько можно тратить в день

<b>Как начать</b>
Открой приложение кнопкой ниже, настройка займёт пару минут.

А ещё можно писать мне прямо сюда:
<code>кофе 350</code> → трата
<code>эссе до 6.11</code> → дедлайн`;
const HELP = `<b>Как пользоваться</b>

<b>Приложение</b> открывается кнопкой «Открыть» внизу чата. Там планер, дедлайны, сессия и бюджет.

<b>Быстрый ввод</b>, пиши обычным сообщением:
<code>кофе 350</code> · <code>такси 420</code> → трата
<code>ресторан 3100 пополам</code> → общая трата с партнёром
<code>+58000 зарплата</code> → доход
<code>эссе до 6.11</code> · <code>отчёт до 15.11</code> → дедлайн

<b>Команды</b>
/today · что сегодня
/app · открыть приложение
/help · эта подсказка`;

// ---------- Даты ----------
function todayIso() {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return p; // YYYY-MM-DD
}
const parseD = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const isoD = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => { const d = parseD(s); d.setUTCDate(d.getUTCDate() + n); return isoD(d); };
const diff = (a: string, b: string) => Math.round((parseD(b).getTime() - parseD(a).getTime()) / 864e5);
const wd = (s: string) => (parseD(s).getUTCDay() + 6) % 7;
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const dShort = (s: string) => { const d = parseD(s); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
const plural = (n: number, f: string[]) => { const a = Math.abs(n) % 100, b = a % 10; return f[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2]; };

// ---------- Разбор быстрого ввода ----------
const CAT_RULES: [RegExp, string][] = [
  [/коф|кафе|обед|ланч|ресторан|бар\b|пицц|суши|бургер|завтрак|ужин|доставк/i, 'Кафе'],
  [/продукт|еда|магаз|пят[её]роч|перекр[её]ст|лавк|самокат|вкусвилл|ашан|магнит/i, 'Еда'],
  [/такси|метро|проезд|автобус|электрич|каршер|бензин|транспорт/i, 'Транспорт'],
  [/кино|театр|концерт|музей|боулинг|игр|развлеч|клуб/i, 'Развлечения'],
  [/одежд|плать|свитер|джинс|обув|кроссов|куртк|футболк/i, 'Одежда'],
  [/аптек|врач|лекарств|стоматолог|анализ/i, 'Здоровье'],
  [/подар|цвет/i, 'Подарки'],
  [/книг|курс|учеб|учёб|распечат|канцел/i, 'Учёба'],
  [/аренд|квартплат|коммунал|интернет|связь|телефон/i, 'Дом'],
];
const WORK_RE = /отч[её]т|презент|клиент|встреч|созвон|ревью|проект на работ|kpi|задач[аи] по работе/i;
const LOVE_RE = /годовщин|подарок|свидани|день рождени|др\b/i;

function parseQuick(text: string) {
  const t = text.trim().replace(/\s+/g, ' ');
  // дедлайн: «эссе до 6.11», «отчёт до 15.11.2026»
  let m = t.match(/^(.+?)\s+до\s+(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?$/i);
  if (m) {
    const today = todayIso();
    let y = m[4] ? Number(m[4].length === 2 ? '20' + m[4] : m[4]) : Number(today.slice(0, 4));
    const mo = Number(m[3]), d = Number(m[2]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    let due = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!m[4] && due < today) { y++; due = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
    const title = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    const sphere = WORK_RE.test(title) ? 'work' : LOVE_RE.test(title) ? 'love' : 'study';
    return { kind: 'deadline' as const, payload: { title, due, sphere } };
  }
  // доход: «+58000 зарплата»
  m = t.match(/^\+\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₽|р\.?|руб\S*)?\s*(.*)$/i);
  if (m) return { kind: 'tx' as const, payload: { type: 'in', amount: Number(m[1].replace(/\s/g, '').replace(',', '.')), note: m[2] || 'Доход', cat: 'Доход' } };
  // трата: «кофе 350», «350 кофе», «ресторан 3100 пополам»
  let shared = false;
  let s = t;
  if (/\s(пополам|общ(ая|ее|ий)?|на двоих)$/i.test(s)) { shared = true; s = s.replace(/\s(пополам|общ(ая|ее|ий)?|на двоих)$/i, ''); }
  m = s.match(/^(.+?)\s+(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₽|р\.?|руб\S*)?$/i) || s.match(/^(\d[\d\s]*(?:[.,]\d+)?)\s*(?:₽|р\.?|руб\S*)?\s+(.+)$/i);
  if (m) {
    const numFirst = /^\d/.test(m[1]);
    const amount = Number((numFirst ? m[1] : m[2]).replace(/\s/g, '').replace(',', '.'));
    const note = (numFirst ? m[2] : m[1]).trim();
    if (!amount || amount > 10_000_000 || !/[a-zа-яё]/i.test(note)) return null;
    const cat = CAT_RULES.find(([re]) => re.test(note))?.[1] ?? 'Другое';
    return { kind: 'tx' as const, payload: { type: 'out', amount, note: note.charAt(0).toUpperCase() + note.slice(1), cat, shared, paidBy: 'me' } };
  }
  return null;
}

// ---------- «Что сегодня» по сохранённому состоянию ----------
const toMin = (t: string) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
// deno-lint-ignore no-explicit-any
function todayText(S: any, name: string) {
  const t = todayIso(), w = wd(t);
  // deno-lint-ignore no-explicit-any
  const evs: any[] = [];
  for (const e of S.events || []) {
    if (e.repeat === 'weekly') { if (e.date <= t && wd(e.date) === w && !(e.skip || []).includes(t)) evs.push(e); }
    else if (e.date === t) evs.push(e);
  }
  const work = S.work || {};
  if ((work.days || []).includes(w) && work.from && work.to) evs.push({ title: 'Работа', start: work.from, end: work.to, sphere: 'work', auto: true });
  evs.sort((a, b) => toMin(a.start) - toMin(b.start));
  const partner = S.profile?.partner || 'Партнёр';
  const icon: Record<string, string> = { study: 'учёба', work: 'работа', love: 'вместе', me: 'для себя' };
  const lines: string[] = [`<b>${name ? esc(name) + ', в' : 'В'}от что сегодня</b>`];
  lines.push('', '<b>План</b>');
  if (evs.length) evs.forEach((e) => lines.push(`${e.start}–${e.end}  ${esc(e.title)}${e.auto || !icon[e.sphere] ? '' : ` <i>· ${icon[e.sphere]}</i>`}`));
  else lines.push('Свободный день');

  // deno-lint-ignore no-explicit-any
  const dl = (S.deadlines || []).map((d: any) => {
    const steps = d.steps || [];
    const done = d.done || (steps.length && steps.every((x: any) => x.done));
    const remain = steps.length ? steps.filter((x: any) => !x.done).reduce((a: number, x: any) => a + (Number(x.hours) || 1), 0) : (Number(d.hours) || 3);
    const startBy = addDays(d.due, -(Math.ceil(remain / 2) + 1));
    const next = steps.find((x: any) => !x.done);
    return { d, done, startBy, next };
  }).filter((x: any) => !x.done && (x.d.due < t || x.startBy <= t || diff(t, x.d.due) <= 3))
    .sort((a: any, b: any) => (a.d.due < b.d.due ? -1 : 1));
  if (dl.length) {
    lines.push('', '<b>Сроки</b>');
    // deno-lint-ignore no-explicit-any
    dl.slice(0, 5).forEach((x: any) => {
      const n = diff(t, x.d.due);
      const when = n < 0 ? `просрочен ${-n} ${plural(-n, ['день', 'дня', 'дней'])}` : n === 0 ? 'сегодня' : `через ${n} ${plural(n, ['день', 'дня', 'дней'])}`;
      lines.push(`· ${esc(x.d.title)}: ${when}${x.next ? `\n   дальше: ${esc(x.next.text)}` : ''}`);
    });
  }
  // deno-lint-ignore no-explicit-any
  const risk = (S.subjects || []).filter((s: any) => !s.auto && (s.conds || []).some((c: any) => c.type === 'attend' && Number(c.held) > 0 && Number(c.att) / Number(c.held) * 100 < Number(c.need)));
  // deno-lint-ignore no-explicit-any
  if (risk.length) lines.push('', `<b>Посещаемость</b>\nНиже нормы: ${risk.map((s: any) => esc(s.name)).join(', ')}. Лучше не пропускать.`);
  if (!S.onboarded) lines.push('', 'Похоже, приложение ещё не настроено. Открой его, это пара минут.');
  void partner;
  return lines.join('\n');
}

// ---------- Пользователь ----------
async function userByTg(tgId: number) {
  const { data } = await admin.from('lp_state').select('user_id, state').eq('tg_id', tgId).maybeSingle();
  return data as { user_id: string; state: Record<string, unknown> } | null;
}

// ---------- Обработка обновлений ----------
// deno-lint-ignore no-explicit-any
async function onMessage(msg: any) {
  const chat = msg.chat.id, from = msg.from || {};
  if (msg.chat.type !== 'private') return;
  const text: string = (msg.text || '').trim();
  const name = from.first_name || '';
  if (/^\/start\b/.test(text)) {
    const kb = { inline_keyboard: [[openBtn()], [{ text: 'Как пользоваться', callback_data: 'help' }]] };
    const r = await tg('sendPhoto', { chat_id: chat, photo: PHOTO, caption: welcome(name), parse_mode: 'HTML', reply_markup: kb });
    if (!r.ok) await tg('sendMessage', { chat_id: chat, text: welcome(name), parse_mode: 'HTML', reply_markup: kb });
    return;
  }
  if (/^\/help\b/.test(text)) return tg('sendMessage', { chat_id: chat, text: HELP, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[openBtn()]] } });
  if (/^\/app\b/.test(text)) return tg('sendMessage', { chat_id: chat, text: 'Твой планер:', reply_markup: { inline_keyboard: [[openBtn()]] } });
  if (/^\/today\b/.test(text)) {
    const u = await userByTg(from.id);
    if (!u) return tg('sendMessage', { chat_id: chat, text: 'Сначала открой приложение, чтобы я тебя узнала', reply_markup: { inline_keyboard: [[openBtn()]] } });
    return tg('sendMessage', { chat_id: chat, text: todayText(u.state || {}, name), parse_mode: 'HTML', reply_markup: { inline_keyboard: [[openBtn('Открыть планер')]] } });
  }
  if (!text || text.startsWith('/')) return tg('sendMessage', { chat_id: chat, text: 'Не знаю такой команды. /help подскажет, что я умею.' });

  const q = parseQuick(text);
  if (!q) return tg('sendMessage', { chat_id: chat, text: 'Не поняла Напиши, например, <code>кофе 350</code> или <code>эссе до 6.11</code>.', parse_mode: 'HTML' });
  const u = await userByTg(from.id);
  if (!u) return tg('sendMessage', { chat_id: chat, text: 'Чтобы записывать, сначала открой приложение один раз', reply_markup: { inline_keyboard: [[openBtn()]] } });
  const payload = { ...q.payload, date: todayIso() };
  const { data: row, error } = await admin.from('lp_inbox').insert({ user_id: u.user_id, kind: q.kind, payload }).select('id').single();
  if (error) { console.error(error); return tg('sendMessage', { chat_id: chat, text: 'Не получилось записать, попробуй ещё раз.' }); }
  // deno-lint-ignore no-explicit-any
  const p: any = q.payload;
  const partner = (u.state as any)?.profile?.partner || 'партнёром';
  const reply = q.kind === 'deadline'
    ? `Дедлайн: <b>${esc(p.title)}</b>, до ${dShort(p.due)}.\nВ приложении разбей его на шаги, и я подскажу, когда начинать.`
    : p.type === 'in'
      ? `Доход: <b>+${Math.round(p.amount).toLocaleString('ru-RU')} ₽</b> · ${esc(p.note)}`
      : `${esc(p.cat)} · ${esc(p.note)}: <b>−${Math.round(p.amount).toLocaleString('ru-RU')} ₽</b>${p.shared ? `\nОбщая с ${esc(partner)}, делится пополам` : ''}`;
  return tg('sendMessage', { chat_id: chat, text: reply + '\n<i>Появится в приложении при открытии.</i>', parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [[{ text: 'Отменить', callback_data: 'undo:' + row.id }, openBtn('Открыть')]] } });
}

// deno-lint-ignore no-explicit-any
async function onCallback(cb: any) {
  const data: string = cb.data || '';
  const chat = cb.message?.chat?.id;
  if (data === 'help') { await tg('answerCallbackQuery', { callback_query_id: cb.id }); return tg('sendMessage', { chat_id: chat, text: HELP, parse_mode: 'HTML', reply_markup: { inline_keyboard: [[openBtn()]] } }); }
  if (data.startsWith('undo:')) {
    const id = data.slice(5);
    const u = await userByTg(cb.from.id);
    const { data: del } = u ? await admin.from('lp_inbox').delete().eq('id', id).eq('user_id', u.user_id).select('id') : { data: [] };
    if (del && del.length) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Отменила' });
      return tg('editMessageText', { chat_id: chat, message_id: cb.message.message_id, text: '<s>' + esc(cb.message.text || '').split('\n')[0] + '</s>\nОтменено', parse_mode: 'HTML' });
    }
    return tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Уже в приложении, удали запись там', show_alert: true });
  }
  return tg('answerCallbackQuery', { callback_query_id: cb.id });
}

async function setup() {
  const out: Record<string, unknown> = {};
  out.webhook = await tg('setWebhook', { url: SELF, secret_token: await hookSecret(), allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
  out.description = await tg('setMyDescription', { description: DESCRIPTION });
  out.short = await tg('setMyShortDescription', { short_description: SHORT });
  out.commands = await tg('setMyCommands', { commands: [
    { command: 'start', description: 'Приветствие' },
    { command: 'today', description: 'Что сегодня' },
    { command: 'app', description: 'Открыть планер' },
    { command: 'help', description: 'Как пользоваться' },
  ] });
  out.menu = await tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Открыть', web_app: { url: APP } } });
  return out;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('ok');
    const body = await req.json().catch(() => ({}));
    if (body?.action === 'setup') return new Response(JSON.stringify(await setup()), { headers: { 'Content-Type': 'application/json' } });
    if (req.headers.get('x-telegram-bot-api-secret-token') !== (await hookSecret())) return new Response('forbidden', { status: 403 });
    if (body.message) await onMessage(body.message);
    else if (body.callback_query) await onCallback(body.callback_query);
  } catch (e) {
    console.error(e);
  }
  return new Response('ok');
});
