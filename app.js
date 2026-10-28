/* Три жизни — планер учёбы, работы и отношений.
   Этап 1: данные хранятся на устройстве (localStorage). Слой store() потом заменим на Supabase. */
'use strict';

// ============ Утилиты ============
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = v => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const plural = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return f[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2]; };
const money = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const hrs = h => (Math.round(h * 10) / 10).toString().replace('.', ',') + ' ч';

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const today = () => iso(new Date());
const weekStart = s => { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); };
const wdIdx = s => (parse(s).getDay() + 6) % 7; // 0 = пн
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_S = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_N = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const WD = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
const WD_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const dShort = s => { const d = parse(s); return `${d.getDate()} ${MONTHS_S[d.getMonth()]}`; };
const dLong = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const toMin = t => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

const I = {
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
  cap: '<path d="M2 9.5 12 5l10 4.5-10 4.5z"/><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M22 9.5v5"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2.5"/><path d="M3 10h18M16 15h.01M7 6l9-3 1 3"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2A4.8 4.8 0 0 1 12 7.6a4.8 4.8 0 0 1 9.3 3.2C19.5 15.4 12 20 12 20z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V4.5h6V7M3 12h18"/>',
  three: '<circle cx="8" cy="9" r="4"/><circle cx="16" cy="9" r="4"/><circle cx="12" cy="15.5" r="4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>',
};
const ic = (k, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24">${I[k]}</svg>`;

// ============ Telegram ============
const TG = window.Telegram?.WebApp;
const tgUser = TG?.initDataUnsafe?.user;
const haptic = t => { try { TG?.HapticFeedback?.impactOccurred(t || 'light'); } catch (_) {} };
if (TG) { try { TG.ready(); TG.expand(); } catch (_) {} }

// ============ Хранилище ============
const KEY = 'trizhizni.v1';
const SPHERE_COLORS = { study: 'var(--c-study)', work: 'var(--c-work)', love: 'var(--c-love)', me: 'var(--c-me)' };
const EXTRA_COLORS = ['#b49ad6', '#8fc1b5', '#e8a2c4', '#c9a77c', '#9aa7d8'];
const blank = () => ({
  v: 1, onboarded: false, demo: false, theme: 'auto', checklistHidden: false,
  profile: { name: tgUser?.first_name || '', partner: 'Максим' },
  spheres: [
    { id: 'study', name: 'Учёба', goal: 20 }, { id: 'work', name: 'Работа', goal: 20 },
    { id: 'love', name: 'Максим', goal: 8 }, { id: 'me', name: 'Я', goal: 7 },
  ],
  work: { days: [0, 1, 3, 4], from: '13:00', to: '19:00', hybrid: false, remindSession: true },
  schedule: { url: '' },
  events: [], deadlines: [], subjects: [],
  budget: { incomes: [], fixed: [], tx: [], settled: [], goal: null, fromDuo: true },
  notify: { morning: true, morningAt: '08:30', attendance: true, startNow: true, weekly: true, spend: false },
  ui: { tab: 'planner', day: today(), month: today().slice(0, 7), dlFilter: 'all', open: {} },
});
let S = load();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return Object.assign(blank(), JSON.parse(raw)); } catch (_) {}
  return blank();
}
function save(fromCloud) {
  if (!fromCloud) S._ts = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
  if (!fromCloud) cloudPush();
}
const sp = id => S.spheres.find(x => x.id === id) || S.spheres[0];
const spColor = id => SPHERE_COLORS[id] || sp(id)?.color || '#999';
const spName = id => (id === 'love' ? S.profile.partner || 'Партнёр' : sp(id)?.name) || '';

// ============ Облако (Supabase, общая база с Duo) ============
// Внутри Telegram входим по подписи initData, данные храним в lp_state, записи из бота забираем из lp_inbox.
const SB_URL = 'https://fuisujbwjwbddtfstkbh.supabase.co';
const SB_KEY = 'sb_publishable_BOWxBrtsNsIaUQJYgqEXbQ_vZm6jwLl';
const cloud = { sb: null, uid: null, tgId: null, status: 'local', pushT: null, pulling: false };
const stripUi = st => { const c = JSON.parse(JSON.stringify(st)); delete c.ui; return c; };
async function cloudInit() {
  const initData = TG?.initData;
  if (!initData || !window.supabase) return;
  cloud.status = 'connecting';
  try {
    cloud.sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: true } });
    const r = await fetch(SB_URL + '/functions/v1/lp-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_KEY }, body: JSON.stringify({ initData }) });
    const j = await r.json();
    if (!j.access_token) throw new Error(j.error || 'auth');
    const { data, error } = await cloud.sb.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
    if (error) throw error;
    cloud.uid = data.user.id; cloud.tgId = tgUser?.id || null;
    if (!S.profile.name && j.first_name) S.profile.name = j.first_name;
    cloud.status = 'on';
    await cloudPull(true);
  } catch (e) { console.warn('cloud', e); cloud.status = 'error'; }
}
async function cloudPull(first) {
  if (!cloud.uid || cloud.pulling) return;
  cloud.pulling = true;
  try {
    const { data: row } = await cloud.sb.from('lp_state').select('state, updated_at').eq('user_id', cloud.uid).maybeSingle();
    const remote = row?.state && row.state.v ? row.state : null;
    const remoteTs = remote?._ts || 0, localTs = S._ts || 0;
    const takeRemote = remote && (remoteTs > localTs || (!S.onboarded && remote.onboarded));
    if (takeRemote) {
      const ui = S.ui; S = Object.assign(blank(), remote); S.ui = Object.assign(blank().ui, ui || {});
      save(true); render();
    } else if (first && (localTs > remoteTs || !remote)) {
      if (S.onboarded || S._ts) await cloudPushNow();
    }
    await cloudInbox();
  } catch (e) { console.warn('pull', e); }
  cloud.pulling = false;
}
async function cloudInbox() {
  const { data: items } = await cloud.sb.from('lp_inbox').select('*').order('created_at');
  if (!items?.length) return;
  let n = 0;
  for (const it of items) {
    const p = it.payload || {};
    if (it.kind === 'tx' && num(p.amount) > 0) { S.budget.tx.push({ id: uid(), type: p.type === 'in' ? 'in' : 'out', amount: num(p.amount), date: p.date || today(), cat: p.cat || 'Другое', note: p.note || '', shared: !!p.shared, paidBy: p.paidBy || 'me' }); n++; }
    if (it.kind === 'deadline' && p.title && p.due) { const d = { id: uid(), title: p.title, sphere: S.spheres.some(x => x.id === p.sphere) ? p.sphere : 'study', due: p.due, steps: [] }; S.deadlines.push(d); S.ui.open[d.id] = true; n++; }
  }
  await cloud.sb.from('lp_inbox').delete().in('id', items.map(i => i.id));
  if (n) { save(); render(); toast(`Из бота: ${n} ${plural(n, ['запись', 'записи', 'записей'])}`); }
}
function cloudPush() {
  if (!cloud.uid) return;
  clearTimeout(cloud.pushT);
  cloud.pushT = setTimeout(cloudPushNow, 700);
}
async function cloudPushNow() {
  if (!cloud.uid) return;
  clearTimeout(cloud.pushT);
  try {
    const { error } = await cloud.sb.from('lp_state').upsert({ user_id: cloud.uid, tg_id: cloud.tgId, state: stripUi(S), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    cloud.status = 'on';
  } catch (e) { console.warn('push', e); cloud.status = 'error'; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudPull(); else cloudPushNow(); });
TG?.onEvent?.('activated', () => cloudPull());

// ============ Тема ============
function applyTheme() {
  const dark = S.theme === 'dark' || (S.theme === 'auto' && (TG?.colorScheme === 'dark' || (!TG && matchMedia('(prefers-color-scheme: dark)').matches)));
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = dark ? '#141b17' : '#eef3ee';
  try { TG?.setHeaderColor?.(dark ? '#141b17' : '#eef3ee'); TG?.setBackgroundColor?.(dark ? '#141b17' : '#eef3ee'); } catch (_) {}
}
TG?.onEvent?.('themeChanged', applyTheme);

// ============ Тосты и шторка ============
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200); }
let sheetClose = null;
function openSheet(html, mount) {
  const sh = $('#sheet');
  sh.innerHTML = '<div class="grip"></div>' + html;
  sh.classList.add('open'); $('#backdrop').classList.add('open');
  sh.scrollTop = 0;
  try { TG?.BackButton?.show(); } catch (_) {}
  mount && mount(sh);
}
function closeSheet() {
  $('#sheet').classList.remove('open'); $('#backdrop').classList.remove('open');
  try { TG?.BackButton?.hide(); } catch (_) {}
}
$('#backdrop').onclick = closeSheet;
TG?.BackButton?.onClick?.(closeSheet);
const val = (sh, name) => sh.querySelector(`[name="${name}"]`)?.value ?? '';
function segInit(root) {
  $$('.seg, .chips[data-single]', root).forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', g).forEach(x => x.classList.toggle('on', x === b)); g.dataset.value = b.dataset.v; haptic();
  }));
  $$('.tg', root).forEach(t => t.addEventListener('click', () => { t.classList.toggle('on'); haptic(); t.dispatchEvent(new Event('change')); }));
}
const segVal = (root, name) => root.querySelector(`[data-name="${name}"]`)?.dataset.value;

// ============ События (с работой и повторами) ============
function eventsOn(date) {
  const out = [];
  const wd = wdIdx(date);
  for (const e of S.events) {
    if (e.repeat === 'weekly') { if (e.date <= date && wdIdx(e.date) === wd && !(e.skip || []).includes(date)) out.push({ ...e, occ: date }); }
    else if (e.date === date) out.push({ ...e, occ: date });
  }
  if (S.work.days.includes(wd) && S.work.from && S.work.to && !(S.work.off || []).includes(date)) {
    out.push({ id: 'work', title: S.work.hybrid ? 'Работа (можно из дома)' : 'Работа', sphere: 'work', start: S.work.from, end: S.work.to, occ: date, auto: true });
  }
  return out.sort((a, b) => toMin(a.start) - toMin(b.start));
}
const evHours = e => Math.max(0, toMin(e.end) - toMin(e.start)) / 60;

// ============ Дедлайны: расчёты ============
const DAILY_H = 2; // сколько часов в день реально уделять одной задаче
function dlInfo(d) {
  const steps = d.steps || [];
  const doneSteps = steps.filter(s => s.done).length;
  const remainH = steps.length ? steps.filter(s => !s.done).reduce((a, s) => a + (num(s.hours) || 1), 0) : (d.done ? 0 : num(d.hours) || 3);
  const totalH = steps.length ? steps.reduce((a, s) => a + (num(s.hours) || 1), 0) : num(d.hours) || 3;
  const done = d.done || (steps.length > 0 && doneSteps === steps.length);
  const startBy = addDays(d.due, -(Math.ceil(remainH / DAILY_H) + 1));
  const t = today();
  let status = 'soon';
  if (done) status = 'done';
  else if (d.due < t) status = 'late';
  else if (t >= startBy) status = 'now';
  const pct = steps.length ? doneSteps / steps.length : (done ? 1 : 0);
  return { done, doneSteps, remainH, totalH, startBy, status, pct, next: steps.find(s => !s.done) };
}
function dlBadge(d, inf) {
  const t = today();
  if (inf.status === 'done') return '<span class="pill green">готово</span>';
  if (inf.status === 'late') { const n = diffDays(d.due, t); return `<span class="pill red">просрочен ${n} ${plural(n, ['день', 'дня', 'дней'])}</span>`; }
  if (inf.status === 'now') return '<span class="pill warm">пора начинать</span>';
  const n = diffDays(t, d.due);
  return `<span class="pill">через ${n} ${plural(n, ['день', 'дня', 'дней'])}</span>`;
}
function collisions() {
  const t = today(), map = {};
  S.deadlines.forEach(d => { if (!dlInfo(d).done && d.due >= t && diffDays(t, d.due) <= 45) (map[d.due] = map[d.due] || []).push(d); });
  return Object.entries(map).filter(([, a]) => a.length > 1).sort(([a], [b]) => a < b ? -1 : 1);
}
function dayLoad(date) { return eventsOn(date).reduce((a, e) => a + evHours(e), 0); }

// ============ Учёба: расчёты ============
function condOk(c) {
  if (c.type === 'check') return !!c.done;
  if (c.type === 'count') return num(c.cur) >= num(c.total) && num(c.total) > 0;
  if (c.type === 'attend') { const p = attendPct(c); return p !== null && p >= num(c.need); }
  return false;
}
const attendPct = c => num(c.held) > 0 ? Math.round(num(c.att) / num(c.held) * 100) : null;
function subjState(s) {
  const conds = s.conds || [];
  const ok = conds.filter(condOk).length;
  if (s.auto) return { key: 'auto', label: 'Автомат', ok, total: conds.length };
  if (!conds.length) return { key: 'empty', label: 'Без условий', ok, total: 0 };
  if (ok === conds.length) return { key: 'adm', label: 'Допуск есть', ok, total: conds.length };
  const soon = s.date && diffDays(today(), s.date) <= 30;
  const attendBad = conds.some(c => c.type === 'attend' && attendPct(c) !== null && attendPct(c) < num(c.need));
  const risk = attendBad || (soon && ok / Math.max(1, conds.length) < .75);
  return { key: risk ? 'risk' : 'almost', label: risk ? 'Есть риск' : 'Почти допуск', ok, total: conds.length };
}
const ST_COLOR = { auto: 'var(--accent)', adm: '#a9d1b5', almost: 'var(--c-work)', risk: 'var(--danger)', empty: 'color-mix(in srgb, var(--ink) 18%, transparent)' };
const KIND = { exam: 'экзамен', credit: 'зачёт', diff: 'диф. зачёт' };

// ============ Бюджет: расчёты ============
function monthTx(m) { return S.budget.tx.filter(t => t.date.slice(0, 7) === m); }
const myShare = t => t.shared ? num(t.amount) / 2 : num(t.amount);
function budgetCalc(m) {
  const tx = monthTx(m);
  const incomeBase = S.budget.incomes.reduce((a, i) => a + num(i.amount), 0);
  const extraIn = tx.filter(t => t.type === 'in').reduce((a, t) => a + num(t.amount), 0);
  const income = incomeBase + extraIn;
  const out = tx.filter(t => t.type !== 'in');
  const fixed = S.budget.fixed.reduce((a, f) => a + num(f.amount), 0);
  const spentTx = out.reduce((a, t) => a + myShare(t), 0);
  const g = S.budget.goal;
  let savePlan = 0;
  if (g && num(g.target) > num(g.saved)) {
    const months = g.deadline ? Math.max(1, (parse(g.deadline).getFullYear() - parse(m + '-01').getFullYear()) * 12 + parse(g.deadline).getMonth() - parse(m + '-01').getMonth()) : 6;
    savePlan = (num(g.target) - num(g.saved)) / months;
  }
  const spent = spentTx + fixed;
  const [y, mo] = m.split('-').map(Number);
  const dim = new Date(y, mo, 0).getDate();
  const isCur = m === today().slice(0, 7);
  const daysLeft = isCur ? dim - new Date().getDate() + 1 : (m > today().slice(0, 7) ? dim : 0);
  const free = income - spent - savePlan;
  const perDay = daysLeft > 0 ? free / daysLeft : 0;
  const cats = {};
  out.forEach(t => { const k = t.shared ? 'Общее ♡' : t.cat || 'Другое'; cats[k] = (cats[k] || 0) + myShare(t); });
  S.budget.fixed.forEach(f => { cats[f.name || 'Обязательное'] = (cats[f.name || 'Обязательное'] || 0) + num(f.amount); });
  return { tx, income, incomeBase, spent, fixed, savePlan, free, perDay, daysLeft, cats, isCur };
}
function hourlyRate() {
  const sal = S.budget.incomes.find(i => /зарп/i.test(i.name)) || S.budget.incomes[0];
  const wh = S.work.days.length * (toMin(S.work.to) - toMin(S.work.from)) / 60 * 4.33;
  if (!sal || !wh) return 0;
  return num(sal.amount) / wh;
}
function sharedBalance() {
  const sh = S.budget.tx.filter(t => t.shared && t.type !== 'in');
  const me = sh.filter(t => t.paidBy !== 'partner').reduce((a, t) => a + num(t.amount), 0);
  const him = sh.filter(t => t.paidBy === 'partner').reduce((a, t) => a + num(t.amount), 0);
  const settled = S.budget.settled.reduce((a, x) => a + num(x.amount), 0); // + значит он вернул мне
  return { me, him, owed: (me - him) / 2 - settled };
}
const CATS = ['Еда', 'Кафе', 'Транспорт', 'Одежда', 'Развлечения', 'Учёба', 'Здоровье', 'Подарки', 'Дом', 'Другое'];

// ============ Рендер ============
function render() {
  applyTheme();
  const app = $('#app');
  if (!S.onboarded) { $('#tabbar').classList.add('hidden'); $('#fab').classList.add('hidden'); app.innerHTML = renderOnb(); mountOnb(); return; }
  $('#tabbar').classList.remove('hidden'); $('#fab').classList.remove('hidden');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.ui.tab));
  const fn = { planner: renderPlanner, deadlines: renderDeadlines, study: renderStudy, budget: renderBudget }[S.ui.tab];
  app.innerHTML = `<div class="wrap">${S.demo ? demoBanner() : ''}${fn()}</div>`;
  bind();
}
$$('#tabbar button').forEach(b => b.onclick = () => { S.ui.tab = b.dataset.tab; save(); haptic(); render(); scrollTo(0, 0); });
$('#fab').onclick = () => { haptic('medium'); ({ planner: () => editEvent(), deadlines: () => editDeadline(), study: () => editSubject(), budget: () => editTx() })[S.ui.tab](); };

function demoBanner() {
  return `<div class="glass green row sb"><div class="t"><b>Это пример</b><div class="m s">Потыкай, а когда будешь готова, начни со своих данных</div></div><button class="btn acc" data-act="demo-off">Начать</button></div>`;
}
const head = (sub, title, right = '') => `<div class="head"><div><div class="m s">${sub}</div><h1 class="ttl">${title}</h1></div><div class="row">${right}</div></div>`;

// ---------- Планер ----------
function renderPlanner() {
  const sel = S.ui.day, ws = weekStart(sel), t = today();
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const we = days[6];
  const hours = {}; S.spheres.forEach(s => hours[s.id] = 0);
  const loads = days.map(d => {
    const by = {}; eventsOn(d).forEach(e => { const h = evHours(e); by[e.sphere] = (by[e.sphere] || 0) + h; hours[e.sphere] = (hours[e.sphere] || 0) + h; });
    return { d, by, total: Object.values(by).reduce((a, b) => a + b, 0) };
  });
  const totalWeek = Object.values(hours).reduce((a, b) => a + b, 0);
  const goalTotal = S.spheres.reduce((a, s) => a + num(s.goal), 0);
  const maxLoad = Math.max(10, ...loads.map(l => l.total));
  const over = loads.filter(l => l.total > 12 && l.d >= t);
  const wsd = parse(ws), wed = parse(we);
  const range = wsd.getMonth() === wed.getMonth() ? `${wsd.getDate()}–${wed.getDate()} ${MONTHS_S[wed.getMonth()]}` : `${dShort(ws)} – ${dShort(we)}`;

  let h = head(range, 'неделя', `<button class="icon-btn" data-act="wk" data-d="-7" aria-label="Прошлая неделя">${ic('left')}</button><button class="icon-btn" data-act="wk" data-d="7" aria-label="Следующая неделя">${ic('right')}</button><button class="icon-btn" data-act="settings" aria-label="Настройки">${ic('gear')}</button>`);
  h += checklistCard();

  // баланс
  h += `<div class="glass"><div class="row sb" style="margin-bottom:8px"><span class="h">Баланс недели</span><span class="m s">${hrs(totalWeek)} из ${goalTotal} ч</span></div>
    <div class="stack">${S.spheres.map(s => hours[s.id] ? `<span style="flex:${hours[s.id]};background:${spColor(s.id)}"></span>` : '').join('')}</div>
    <div class="legend">${S.spheres.map(s => { const lag = s.id === 'love' && num(s.goal) && hours[s.id] < num(s.goal) * .6; return `<div><span class="dot" style="background:${spColor(s.id)}"></span><span class="wrapt">${esc(spName(s.id))}</span><b style="margin-left:auto;${lag ? 'color:var(--danger)' : ''}">${hrs(hours[s.id] || 0).replace(' ч', '')}</b><span class="m s">/ ${num(s.goal)}</span></div>`; }).join('')}</div></div>`;

  // дни и нагрузка
  h += `<div class="glass" style="padding:10px 8px"><div class="days">${days.map((d, i) => `<button data-act="day" data-d="${d}" class="${d === sel ? 'sel' : ''} ${d === t ? 'today' : ''}">${WD[i]}<b>${parse(d).getDate()}</b></button>`).join('')}</div>
    <div class="loads">${loads.map(l => `<div class="${l.total > 12 ? 'over' : ''}" style="height:${Math.max(4, l.total / maxLoad * 100)}%">${S.spheres.map(s => l.by[s.id] ? `<span style="flex:${l.by[s.id]};background:${spColor(s.id)}"></span>` : '').join('')}</div>`).join('')}</div>
    <div class="days s m" style="margin-top:4px">${loads.map(l => `<span style="${l.total > 12 ? 'color:var(--danger);font-weight:800' : ''}">${l.total ? Math.round(l.total) + 'ч' : '–'}</span>`).join('')}</div></div>`;

  // перегруз
  if (over.length) {
    const o = over[0];
    const lighter = loads.filter(l => l.d >= t && l.d !== o.d).sort((a, b) => a.total - b.total)[0];
    h += `<div class="glass warm"><div class="row" style="align-items:flex-start;gap:10px"><span class="dot" style="background:var(--danger);margin-top:5px"></span><div class="t"><b>${WD_FULL[wdIdx(o.d)]} перегружен: ${hrs(o.total)}.</b> <span class="m">${lighter ? `${WD_FULL[wdIdx(lighter.d)]} свободнее на ${hrs(o.total - lighter.total)}. Перенеси туда что-нибудь.` : 'Попробуй разгрузить этот день.'}</span></div></div>
      <div class="row" style="margin-top:8px;padding-left:18px"><button class="btn" data-act="day" data-d="${o.d}">Открыть день</button></div></div>`;
  }
  const lv = S.spheres.find(s => s.id === 'love');
  if (lv && num(lv.goal) && sel <= t && we >= t && (hours.love || 0) < num(lv.goal) * .5 && wdIdx(t) >= 3) {
    h += `<div class="glass rose"><div class="t"><b>На ${esc(S.profile.partner)} ${hrs(hours.love || 0)} из ${num(lv.goal)}.</b> <span class="m">Запланируй вечер вместе до конца недели.</span></div><div style="margin-top:8px"><button class="btn" data-act="add-love">Запланировать</button></div></div>`;
  }

  // список дня
  const evs = eventsOn(sel);
  const busy = evs.reduce((a, e) => a + evHours(e), 0);
  const free = freeWindows(evs);
  const nextStep = pendingStep();
  const rows = [];
  evs.forEach(e => rows.push({ at: toMin(e.start), html: `<div class="ev" data-act="${e.auto ? 'settings-work' : 'ev'}" data-id="${e.id}" data-occ="${e.occ}"><span class="tm">${e.start}–${e.end}</span><span class="stripe" style="background:${spColor(e.sphere)}"></span><span class="t grow wrapt">${esc(e.title)}${e.repeat === 'weekly' ? ' <span class="m s">· каждую неделю</span>' : ''}${e.place ? ` <span class="m s">· ${esc(e.place)}</span>` : ''}</span></div>` }));
  if (sel >= t && nextStep) free.slice(0, 1).forEach(w => rows.push({ at: w.from, html: `<div class="ev ghost" data-act="fill" data-from="${w.from}" data-to="${w.to}"><span class="tm">${toTime(w.from)}–${toTime(w.to)}</span><span class="stripe"></span><span class="t grow">+ окно ${hrs((w.to - w.from) / 60)}: ${esc(nextStep.step.text)}</span></div>` }));
  rows.sort((a, b) => a.at - b.at);
  const fr = free.reduce((a, w) => a + (w.to - w.from), 0) / 60;
  h += `<div class="glass"><div class="row sb" style="margin-bottom:2px"><span class="h">${WD_FULL[wdIdx(sel)]}, ${parse(sel).getDate()}</span><span class="m s">${evs.length ? `занято ${hrs(busy)} · свободно ${hrs(fr)}` : ''}</span></div>
    <div class="list">${rows.length ? rows.map(r => r.html).join('') : `<div class="empty">Пока пусто. Нажми «+», чтобы добавить пару, встречу или свидание.</div>`}</div></div>`;
  return h;
}
function freeWindows(evs) {
  const out = []; let cur = 9 * 60; const endDay = 22 * 60;
  const now = new Date(); const isToday = S.ui.day === today();
  if (isToday) cur = Math.max(cur, Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30);
  [...evs].sort((a, b) => toMin(a.start) - toMin(b.start)).forEach(e => {
    const s = toMin(e.start), en = toMin(e.end);
    if (s - cur >= 60) out.push({ from: cur + 15, to: s - 15 });
    cur = Math.max(cur, en);
  });
  if (endDay - cur >= 75) out.push({ from: cur + 15, to: Math.min(endDay, cur + 15 + 120) });
  return out.filter(w => w.to - w.from >= 45);
}
function pendingStep() {
  const list = S.deadlines.map(d => ({ d, inf: dlInfo(d) })).filter(x => !x.inf.done && x.inf.next).sort((a, b) => a.inf.startBy < b.inf.startBy ? -1 : 1);
  return list[0] ? { d: list[0].d, step: list[0].inf.next } : null;
}
function checklistCard() {
  if (S.checklistHidden || S.demo) return '';
  const items = [
    { ok: true, t: 'Цели по сферам' },
    { ok: S.budget.incomes.length > 0, t: 'Доходы', act: 'settings-budget' },
    { ok: !!S.schedule.url || S.events.some(e => e.sphere === 'study'), t: 'Расписание пар', act: 'add-class' },
    { ok: S.subjects.some(s => (s.conds || []).length), t: 'Условия допуска', act: 'go-study' },
    { ok: S.deadlines.length > 0, t: 'Первый дедлайн', act: 'go-dl' },
  ];
  const n = items.filter(i => i.ok).length;
  if (n === items.length) return '';
  return `<div class="glass"><div class="row sb"><b class="t">Доделать настройку</b><span class="row"><span class="m s">${n} из ${items.length}</span><button class="del" data-act="hide-check" aria-label="Скрыть">×</button></span></div>
    <div class="bar" style="margin:8px 0 6px"><span style="width:${n / items.length * 100}%;background:var(--accent)"></span></div>
    ${items.map(i => `<div class="row t" style="padding:4px 0"><span class="ck ${i.ok ? 'on' : ''}">${i.ok ? '✓' : ''}</span><span class="${i.ok ? 'm' : ''}" style="${i.ok ? 'text-decoration:line-through' : 'font-weight:700'}">${i.t}</span>${!i.ok && i.act ? `<button class="link" style="margin-left:auto" data-act="${i.act}">добавить ›</button>` : ''}</div>`).join('')}</div>`;
}

// ---------- Дедлайны ----------
function renderDeadlines() {
  const t = today();
  const all = S.deadlines.map(d => ({ d, inf: dlInfo(d) }));
  const f = S.ui.dlFilter;
  const vis = all.filter(x => f === 'all' || x.d.sphere === f);
  const active = vis.filter(x => !x.inf.done).sort((a, b) => ({ late: 0, now: 1, soon: 2 }[a.inf.status] - { late: 0, now: 1, soon: 2 }[b.inf.status]) || (a.d.due < b.d.due ? -1 : 1));
  const done = vis.filter(x => x.inf.done);
  const lateN = all.filter(x => x.inf.status === 'late').length;
  const actN = all.filter(x => !x.inf.done).length;

  let h = head(`${actN} ${plural(actN, ['активный', 'активных', 'активных'])}${lateN ? ` · ${lateN} просрочен` : ''}`, 'дедлайны');
  h += `<div class="chips" data-f>${[['all', 'все'], ...S.spheres.map(s => [s.id, spName(s.id).toLowerCase()])].map(([k, n]) => `<button class="chip ${f === k ? 'on' : ''}" data-act="dlf" data-f="${k}">${esc(n)}</button>`).join('')}</div>`;

  // шкала 3 недели
  const span = 21, upcoming = all.filter(x => !x.inf.done && diffDays(t, x.d.due) <= span);
  if (upcoming.length) {
    const groups = {}; upcoming.forEach(x => { const k = x.d.due < t ? t : x.d.due; (groups[k] = groups[k] || []).push(x); });
    const pts = Object.entries(groups).map(([d, arr]) => {
      const left = 4 + clamp(diffDays(t, d), 0, span) / span * 92;
      const late = d === t && arr.some(x => x.inf.status === 'late');
      if (arr.length > 1) return `<span class="pt multi" style="left:${left}%">${arr.length}</span><span class="lb" style="left:${left}%;top:0;color:var(--danger);font-weight:800">${dShort(d)}</span>`;
      const x = arr[0];
      return `<span class="pt" style="left:${left}%;background:${late ? 'var(--danger)' : spColor(x.d.sphere)}"></span><span class="lb" style="left:${clamp(left, 8, 92)}%;top:34px">${esc(x.d.title.split(' ')[0].toLowerCase().slice(0, 12))}</span>`;
    }).join('');
    h += `<div class="glass" style="padding:10px 12px"><div class="row sb s m"><span>ближайшие 3 недели</span><span>сегодня → ${dShort(addDays(t, span))}</span></div><div class="tl"><span class="axis"></span><span class="now"></span>${pts}</div></div>`;
  }

  if (!active.length && !done.length) h += `<div class="glass"><div class="h">Добавь первый дедлайн</div><div class="m t" style="margin:4px 0 10px">Разбей его на шаги с примерным временем, и приложение подскажет, когда пора начинать, чтобы не сидеть ночью перед сдачей.</div><button class="btn acc" data-act="new-dl">Добавить дедлайн</button></div>`;

  active.forEach(({ d, inf }) => {
    const open = S.ui.open[d.id] ?? (inf.status !== 'soon');
    const steps = d.steps || [];
    h += `<div class="glass"><div class="row sb" style="align-items:flex-start" data-act="dl-toggle" data-id="${d.id}"><span class="row grow" style="align-items:flex-start"><span class="dot" style="background:${spColor(d.sphere)};margin-top:6px"></span><b class="t wrapt">${esc(d.title)}</b></span>${dlBadge(d, inf)}</div>
      <div class="m s" style="margin:3px 0 8px 16px">${inf.status === 'late' ? 'был до' : 'сдать'} ${dLong(d.due)}${steps.length ? ` · ${inf.doneSteps} из ${steps.length} шагов` : ''} · осталось ~${hrs(inf.remainH)}${inf.status === 'soon' ? ` · начать до ${dShort(inf.startBy)}` : ''}</div>
      <div class="bar" style="margin-left:16px"><span style="width:${Math.max(3, inf.pct * 100)}%;background:${spColor(d.sphere)}"></span></div>
      ${open ? `<div style="margin:8px 0 0 16px">${steps.map(s => `<div class="step ${s.done ? 'done' : ''}"><button class="ck ${s.done ? 'on' : ''}" data-act="step" data-id="${d.id}" data-s="${s.id}">${s.done ? '✓' : ''}</button><span class="tx grow wrapt">${esc(s.text)}</span><span class="m s">${s.hours ? hrs(num(s.hours)) : ''}</span></div>`).join('')}
        <div class="row" style="margin-top:6px"><input class="inp" style="padding:8px 10px;font-size:13px" placeholder="Новый шаг" data-newstep="${d.id}"><input class="inp" style="padding:8px 10px;font-size:13px;width:64px" placeholder="ч" inputmode="decimal" data-newstep-h="${d.id}"><button class="btn g" data-act="add-step" data-id="${d.id}">+</button></div>
        <div class="row" style="margin-top:8px">${inf.next ? `<button class="btn" data-act="plan-step" data-id="${d.id}">В планер: «${esc(inf.next.text.slice(0, 22))}»</button>` : `<button class="btn acc" data-act="dl-done" data-id="${d.id}">Сдано</button>`}<button class="btn g" data-act="dl-edit" data-id="${d.id}">${ic('edit').replace('class="ic"', 'class="ic" style="width:16px;height:16px"')}</button></div></div>` : (inf.next ? `<div class="t" style="margin:8px 0 0 16px">➜ Следующий шаг: <b>${esc(inf.next.text)}</b>${inf.next.hours ? ` · ~${hrs(num(inf.next.hours))}` : ''}</div>` : '')}
    </div>`;
  });

  const col = collisions()[0];
  if (col) {
    const [date, arr] = col;
    let alt = null; for (let i = 1; i <= 4; i++) { const c = addDays(date, -i); if (c < t) break; if (!alt || dayLoad(c) < dayLoad(alt)) alt = c; }
    h += `<div class="glass warm"><div class="t"><b>${dLong(date)} ${arr.length} ${plural(arr.length, ['сдача', 'сдачи', 'сдач'])} сразу:</b> <span class="m">${arr.map(x => esc(x.title)).join(', ')}.${alt ? ` Закончи одно ${dLong(alt)}: в тот день у тебя ${hrs(dayLoad(alt))} дел.` : ''}</span></div>${alt ? `<div style="margin-top:8px"><button class="btn" data-act="dl-move" data-id="${arr[arr.length - 1].id}" data-d="${alt}">Сдвинуть «${esc(arr[arr.length - 1].title.slice(0, 18))}» на ${dShort(alt)}</button></div>` : ''}</div>`;
  }

  if (done.length) h += `<div class="glass"><div class="row sb" data-act="toggle-done"><span class="h">Сделано</span><span class="m s">${done.length} ${S.ui.showDone ? '▴' : '▾'}</span></div>${S.ui.showDone ? `<div class="list" style="margin-top:4px">${done.map(({ d }) => `<div class="row sb t"><span class="row"><span class="dot" style="background:${spColor(d.sphere)}"></span><span class="m" style="text-decoration:line-through">${esc(d.title)}</span></span><button class="del" data-act="dl-del" data-id="${d.id}">×</button></div>`).join('')}</div>` : ''}</div>`;
  return h;
}

// ---------- Учёба ----------
function renderStudy() {
  const subs = S.subjects;
  const firstExam = subs.map(s => s.date).filter(Boolean).sort()[0];
  const sub = firstExam ? (firstExam >= today() ? `сессия с ${dLong(firstExam)} · через ${diffDays(today(), firstExam)} дн` : 'сессия идёт') : 'добавь предметы сессии';
  let h = head(sub, 'сессия', `<span class="pill" style="padding:6px 10px">${subs.length} ${plural(subs.length, ['предмет', 'предмета', 'предметов'])}</span>`);
  if (!subs.length) return h + `<div class="glass"><div class="h">Какие предметы в эту сессию?</div><div class="m t" style="margin:4px 0 10px">Для каждого запиши условия допуска (лабы, контрольные, посещаемость) или отметь, что уже есть автомат. Приложение будет следить, что ещё осталось.</div><button class="btn acc" data-act="new-subj">Добавить предмет</button></div>`;

  const st = subs.map(s => ({ s, st: subjState(s) }));
  const cnt = k => st.filter(x => x.st.key === k).length;
  const calm = cnt('auto') + cnt('adm');
  h += `<div class="glass"><div class="row sb" style="margin-bottom:8px"><span class="h">Готовность к сессии</span><span class="m s">${calm} из ${subs.length} спокойно</span></div>
    <div class="stack">${['auto', 'adm', 'almost', 'risk', 'empty'].map(k => cnt(k) ? `<span style="flex:${cnt(k)};background:${ST_COLOR[k]}"></span>` : '').join('')}</div>
    <div class="legend">${[['auto', 'Автомат'], ['adm', 'Допуск есть'], ['almost', 'Почти допуск'], ['risk', 'Есть риск'], ...(cnt('empty') ? [['empty', 'Без условий']] : [])].map(([k, n]) => `<div><span class="dot" style="background:${ST_COLOR[k]}"></span>${n}<b style="margin-left:auto;${k === 'risk' && cnt(k) ? 'color:var(--danger)' : ''}">${cnt(k)}</b></div>`).join('')}</div></div>`;

  const order = { risk: 0, almost: 1, empty: 2, adm: 3, auto: 4 };
  const detailed = st.filter(x => x.st.key === 'risk' || x.st.key === 'almost' || (x.s.rating && !x.s.auto)).sort((a, b) => order[a.st.key] - order[b.st.key]);
  detailed.forEach(({ s, st: z }) => {
    const pill = z.key === 'risk' ? '<span class="pill rose">риск недопуска</span>' : z.key === 'almost' ? '<span class="pill warm">почти допуск</span>' : '<span class="pill green">допуск ✓</span>';
    const unmet = (s.conds || []).filter(c => !condOk(c));
    const hints = unmet.map(c => c.type === 'count' ? `${esc(c.title.toLowerCase())}: ещё ${num(c.total) - num(c.cur)}${c.due ? ` до ${dShort(c.due)}` : ''}` : c.type === 'attend' ? `посещаемость: не пропускать пары` : esc(c.title.toLowerCase())).join(', ');
    const rt = s.rating;
    h += `<div class="glass"><div class="row sb" data-act="subj" data-id="${s.id}"><b class="t wrapt">${esc(s.name)} · ${KIND[s.kind] || ''}</b>${rt && z.key !== 'risk' && z.key !== 'almost' ? `<span class="pill warm">до автомата ${Math.max(0, num(rt.need) - num(rt.cur))}</span>` : pill}</div>
      <div class="m s" style="margin:2px 0 8px">${s.date ? dShort(s.date) + ' · ' : ''}${(s.conds || []).length ? `условия допуска ${z.ok} из ${z.total}` : 'условия допуска не добавлены'}</div>
      ${(s.conds || []).map(c => condRow(s, c)).join('')}
      ${rt ? `<div class="row" style="margin:8px 0 2px;gap:8px"><span class="t">Рейтинг</span><div class="bar grow" style="height:8px;position:relative;overflow:visible"><span style="width:${clamp(num(rt.cur) / Math.max(num(rt.need), 100) * 100, 2, 100)}%;background:var(--c-study)"></span><i style="position:absolute;left:${num(rt.need) / Math.max(num(rt.need), 100) * 100}%;top:-4px;width:2px;height:16px;background:var(--ink);border-radius:2px"></i></div><span class="s"><b>${num(rt.cur)}</b> / ${num(rt.need)}</span></div>${rt.note ? `<div class="m s">${esc(rt.note)}</div>` : ''}` : ''}
      ${hints ? `<div class="t" style="margin-top:9px;padding:8px 10px;border-radius:12px;background:var(--soft)">Осталось: ${hints}.</div>` : ''}
      <div class="row" style="margin-top:8px">${unmet.some(c => c.type === 'count' || c.type === 'check') ? `<button class="btn" data-act="subj-dl" data-id="${s.id}">Добавить в дедлайны</button>` : ''}<button class="btn g" data-act="subj" data-id="${s.id}">Изменить</button></div></div>`;
  });

  const rest = st.filter(x => !detailed.includes(x));
  if (rest.length) h += `<div class="glass" style="padding:6px 14px"><div class="list">${rest.map(({ s, st: z }) => `<div class="row sb" data-act="subj" data-id="${s.id}"><span class="row grow"><span class="dot" style="background:${ST_COLOR[z.key]}"></span><span class="t wrapt">${esc(s.name)}</span></span><span class="pill ${z.key === 'auto' ? 'green' : ''}">${z.key === 'empty' ? 'добавь условия допуска ›' : z.key === 'auto' ? `автомат${s.autoGrade ? ' ' + esc(s.autoGrade) : ''} ✓` : `допуск ✓${s.date ? ' · ' + KIND[s.kind] + ' ' + dShort(s.date) : ''}`}</span></div>`).join('')}</div></div>`;
  return h;
}
function condRow(s, c) {
  const ok = condOk(c);
  if (c.type === 'check') return `<div class="row t" style="padding:3px 0"><button class="ck ${ok ? 'on' : ''}" data-act="cond-check" data-id="${s.id}" data-c="${c.id}">${ok ? '✓' : ''}</button><span class="grow wrapt">${esc(c.title)}</span>${c.note ? `<span class="m s">${esc(c.note)}</span>` : ''}</div>`;
  if (c.type === 'count') return `<div class="row t" style="padding:3px 0"><span class="ck ${ok ? 'on' : ''}">${ok ? '✓' : ''}</span><span class="grow wrapt">${esc(c.title)}</span><button class="btn g" style="padding:3px 9px" data-act="cond-dec" data-id="${s.id}" data-c="${c.id}">−</button><b>${num(c.cur)} / ${num(c.total)}</b><button class="btn g" style="padding:3px 9px" data-act="cond-inc" data-id="${s.id}" data-c="${c.id}">+</button></div>${ok ? '' : `<div class="bar" style="margin:2px 0 4px 26px"><span style="width:${num(c.cur) / Math.max(1, num(c.total)) * 100}%;background:var(--c-study)"></span></div>`}`;
  const p = attendPct(c);
  return `<div class="row t" style="padding:3px 0"><span class="ck ${ok ? 'on' : (p !== null ? 'warn' : '')}">${ok ? '✓' : (p !== null ? '!' : '')}</span><span class="grow">Посещаемость</span><b style="${!ok && p !== null ? 'color:var(--danger)' : ''}">${p === null ? '–' : p + '%'} / ${num(c.need)}%</b></div>
    <div class="row" style="padding:2px 0 4px 26px;gap:6px"><button class="btn g" style="padding:5px 10px" data-act="att" data-v="1" data-id="${s.id}" data-c="${c.id}">была</button><button class="btn g" style="padding:5px 10px" data-act="att" data-v="0" data-id="${s.id}" data-c="${c.id}">пропустила</button><span class="m s">${num(c.att)} из ${num(c.held)} пар</span></div>`;
}

// ---------- Бюджет ----------
function renderBudget() {
  const m = S.ui.month, b = budgetCalc(m);
  const [y, mo] = m.split('-').map(Number);
  const label = MONTHS_N[mo - 1] + (y !== new Date().getFullYear() ? ' ' + y : '');
  let h = head(`${label}${b.isCur ? ` · осталось ${b.daysLeft} ${plural(b.daysLeft, ['день', 'дня', 'дней'])}` : ''}`, 'бюджет', `<button class="icon-btn" data-act="mon" data-d="-1">${ic('left')}</button><button class="icon-btn" data-act="mon" data-d="1">${ic('right')}</button>`);
  if (!S.budget.incomes.length) h += `<div class="glass warm"><div class="t"><b>Добавь доходы</b> <span class="m">(зарплата, стипендия), и я посчитаю, сколько можно тратить в день.</span></div><div style="margin-top:8px"><button class="btn" data-act="settings-budget">Добавить</button></div></div>`;

  const spentPct = b.income ? clamp(b.spent / b.income * 100, 0, 100) : 0;
  h += `<div class="glass"><div class="m s">${b.isCur ? 'можно тратить' : 'свободно в месяце'}</div>
    <div class="row" style="align-items:baseline;gap:8px"><b style="font-size:30px;letter-spacing:-.02em;${b.free < 0 ? 'color:var(--danger)' : ''}">${b.isCur ? money(Math.max(0, b.perDay)) : money(b.free)}</b>${b.isCur ? `<span class="m t">в день до ${new Date(y, mo, 0).getDate()} ${MONTHS_S[mo - 1]}</span>` : ''}</div>
    ${b.free < 0 ? `<div class="s" style="color:var(--danger);font-weight:700">Перерасход ${money(-b.free)} с учётом копилки</div>` : ''}
    <div class="bar" style="height:10px;margin:10px 0 6px"><span style="width:${spentPct}%;background:var(--accent)"></span></div>
    <div class="row sb s m"><span>потрачено ${money(b.spent)}</span><span>доход ${money(b.income)}</span></div>
    <div class="g3" style="margin-top:10px;text-align:center">${S.budget.incomes.slice(0, 2).map(i => `<div style="background:var(--soft);border-radius:12px;padding:7px 2px"><div class="s m">${esc(i.name.toLowerCase())}</div><b class="t">${Math.round(num(i.amount)).toLocaleString('ru-RU')}</b></div>`).join('')}${b.savePlan ? `<div style="background:var(--soft);border-radius:12px;padding:7px 2px"><div class="s m">в копилку</div><b class="t" style="color:var(--accent)">${Math.round(b.savePlan).toLocaleString('ru-RU')}</b></div>` : ''}</div></div>`;

  const rate = hourlyRate();
  const cats = Object.entries(b.cats).sort((a, c) => c[1] - a[1]);
  if (cats.length) {
    const max = cats[0][1];
    const prev = budgetCalc(prevMonth(m)).cats;
    const grow = cats.filter(([k, v]) => prev[k] > 0 && v > prev[k] * 1.3 && v > 1000)[0];
    h += `<div class="glass"><div class="row sb" style="margin-bottom:8px"><span class="h">Куда ушли деньги</span>${rate ? '<span class="m s">в часах работы</span>' : ''}</div>
      <div style="display:grid;gap:7px" class="t">${cats.map(([k, v]) => `<div style="display:grid;grid-template-columns:minmax(0,92px) 1fr auto ${rate ? '40px' : ''};gap:8px;align-items:center"><span class="wrapt">${esc(k)}</span><div class="bar"><span style="width:${v / max * 100}%;background:${k.startsWith('Общее') ? 'var(--c-love)' : /Кафе/.test(k) ? 'var(--c-work)' : 'var(--accent)'}"></span></div><b style="text-align:right">${Math.round(v).toLocaleString('ru-RU')}</b>${rate ? `<span class="m s" style="text-align:right">${Math.round(v / rate)} ч</span>` : ''}</div>`).join('')}</div>
      ${grow ? `<div class="s" style="margin-top:8px;color:var(--warm-ink)">${esc(grow[0])}: на ${Math.round((grow[1] / prev[grow[0]] - 1) * 100)}% больше, чем в прошлом месяце</div>` : ''}</div>`;
  }

  const g = S.budget.goal;
  if (g) {
    const p = num(g.saved) / Math.max(1, num(g.target));
    h += `<div class="glass"><div class="row sb"><span class="h wrapt">Цель: ${esc(g.name)}</span><span class="m s">${g.deadline ? 'к ' + dShort(g.deadline) : ''}</span></div>
      <div class="row" style="align-items:baseline;gap:6px;margin:4px 0 8px"><b style="font-size:18px">${Math.round(num(g.saved)).toLocaleString('ru-RU')}</b><span class="m t">из ${money(num(g.target))}</span></div>
      <div class="bar" style="height:8px"><span style="width:${clamp(p * 100, 2, 100)}%;background:var(--accent)"></span></div>
      <div class="row sb" style="margin-top:8px"><span class="m s">${p >= 1 ? 'Цель достигнута!' : `Откладывай ${money(b.savePlan)} в месяц${g.deadline ? ', и успеешь' : ''}${rate ? ` · это ${Math.round(b.savePlan / rate)} ч работы` : ''}`}</span><button class="btn g" data-act="goal-add">Пополнить</button></div></div>`;
  } else h += `<div class="glass row sb"><span class="t"><b>Копишь на что-то?</b><div class="m s">Поездка, ноутбук, подушка безопасности</div></span><button class="btn g" data-act="goal-edit">Цель</button></div>`;

  const sb = sharedBalance();
  if (sb.me || sb.him) {
    const who = sb.owed > 0 ? `${esc(S.profile.partner)} должен ${money(sb.owed)}` : sb.owed < 0 ? `ты должна ${money(-sb.owed)}` : 'всё ровно';
    h += `<div class="glass"><div class="row sb"><span class="h">Общие с ${esc(S.profile.partner)}ом</span><b class="t" style="color:${sb.owed ? 'var(--rose-ink)' : 'var(--accent)'}">${who}</b></div>
      <div class="row s m" style="margin-top:4px;gap:14px"><span>ты заплатила ${money(sb.me)}</span><span>${esc(S.profile.partner)} ${money(sb.him)}</span></div>
      ${Math.round(sb.owed) ? `<div style="margin-top:8px"><button class="btn g" data-act="settle">Рассчитались</button></div>` : ''}</div>`;
  }

  const tx = b.tx.slice().sort((a, c) => a.date < c.date ? 1 : -1);
  h += `<div class="glass"><div class="row sb"><span class="h">Операции</span><span class="m s">${tx.length}</span></div><div class="list" style="margin-top:2px">${tx.length ? tx.slice(0, S.ui.allTx ? 999 : 8).map(t => `<div class="row t" data-act="tx" data-id="${t.id}"><span class="m s" style="width:38px">${t.date.slice(8)}.${t.date.slice(5, 7)}</span><span class="grow wrapt">${esc(t.note || t.cat)}${t.shared ? ` <span class="pill rose" style="font-size:9.5px">${t.paidBy === 'partner' ? esc(S.profile.partner) : 'общее'}</span>` : ''}</span><b style="${t.type === 'in' ? 'color:var(--accent)' : ''}">${t.type === 'in' ? '+' : '−'}${Math.round(num(t.amount)).toLocaleString('ru-RU')}</b></div>`).join('') : '<div class="empty">Нажми «+», чтобы записать трату</div>'}</div>${tx.length > 8 && !S.ui.allTx ? '<button class="link" data-act="all-tx">Показать все</button>' : ''}</div>`;
  return h;
}
const prevMonth = m => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 2, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };

// ============ Обработчики ============
function bind() {
  $('#app').onclick = e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    const D = () => S.deadlines.find(x => x.id === id);
    const SUB = () => S.subjects.find(x => x.id === id);
    const C = () => SUB()?.conds.find(c => c.id === el.dataset.c);
    switch (a) {
      case 'wk': S.ui.day = addDays(S.ui.day, +el.dataset.d); break;
      case 'day': S.ui.day = el.dataset.d; break;
      case 'settings': return settings();
      case 'settings-work': return settings('work');
      case 'settings-budget': return settings('budget');
      case 'ev': return editEvent(S.events.find(x => x.id === id), el.dataset.occ);
      case 'fill': { const p = pendingStep(); return editEvent(null, S.ui.day, { title: p.step.text, sphere: p.d.sphere, start: toTime(+el.dataset.from), end: toTime(Math.min(+el.dataset.to, +el.dataset.from + Math.max(30, Math.round((num(p.step.hours) || 1) * 60)))) }); }
      case 'add-love': return editEvent(null, S.ui.day, { title: 'Вечер с ' + S.profile.partner + 'ом', sphere: 'love', start: '19:30', end: '22:00' });
      case 'add-class': return editEvent(null, S.ui.day, { sphere: 'study', repeat: 'weekly', title: '' });
      case 'hide-check': S.checklistHidden = true; break;
      case 'go-study': S.ui.tab = 'study'; break;
      case 'go-dl': S.ui.tab = 'deadlines'; break;
      case 'demo-off': return confirmSheet('Начать со своих данных?', 'Пример удалится, и откроется настройка.', 'Начать', () => { const th = S.theme; S = blank(); S.theme = th; save(); render(); });
      // дедлайны
      case 'dlf': S.ui.dlFilter = el.dataset.f; break;
      case 'new-dl': return editDeadline();
      case 'dl-toggle': { const d = D(); const inf = dlInfo(d); S.ui.open[id] = !(S.ui.open[id] ?? (inf.status !== 'soon')); break; }
      case 'step': { const s = D().steps.find(x => x.id === el.dataset.s); s.done = !s.done; haptic(); if (dlInfo(D()).done) toast('Готово! Дедлайн закрыт'); break; }
      case 'add-step': { const inp = $(`[data-newstep="${id}"]`), hi = $(`[data-newstep-h="${id}"]`); if (!inp.value.trim()) return inp.focus(); (D().steps = D().steps || []).push({ id: uid(), text: inp.value.trim(), hours: num(hi.value) || 1, done: false }); break; }
      case 'plan-step': { const d = D(), inf = dlInfo(d); S.ui.tab = 'planner'; save(); render(); const evs = eventsOn(today()); S.ui.day = today(); const w = freeWindows(evs)[0]; return editEvent(null, today(), { title: inf.next.text, sphere: d.sphere, start: w ? toTime(w.from) : '18:00', end: w ? toTime(Math.min(w.to, w.from + Math.round((num(inf.next.hours) || 1) * 60))) : '19:00' }); }
      case 'dl-done': D().done = true; toast('Сдано!'); break;
      case 'dl-edit': return editDeadline(D());
      case 'dl-del': S.deadlines = S.deadlines.filter(x => x.id !== id); break;
      case 'dl-move': D().due = el.dataset.d; toast('Сдвинула'); break;
      case 'toggle-done': S.ui.showDone = !S.ui.showDone; break;
      // учёба
      case 'new-subj': return editSubject();
      case 'subj': return editSubject(SUB());
      case 'cond-check': C().done = !C().done; haptic(); break;
      case 'cond-inc': C().cur = Math.min(num(C().total), num(C().cur) + 1); haptic(); break;
      case 'cond-dec': C().cur = Math.max(0, num(C().cur) - 1); break;
      case 'att': { const c = C(); c.held = num(c.held) + 1; if (el.dataset.v === '1') c.att = num(c.att) + 1; haptic(); break; }
      case 'subj-dl': { const s = SUB(); const unmet = s.conds.filter(c => !condOk(c) && c.type !== 'attend'); const due = unmet.map(c => c.due).filter(Boolean).sort().pop() || (s.date ? addDays(s.date, -7) : addDays(today(), 21));
        const steps = []; unmet.forEach(c => { if (c.type === 'count') for (let i = num(c.cur) + 1; i <= num(c.total); i++) steps.push({ id: uid(), text: `${c.title} ${i}`, hours: 2, done: false }); else steps.push({ id: uid(), text: c.title, hours: 2, done: false }); });
        S.deadlines.push({ id: uid(), title: `Допуск: ${s.name}`, sphere: 'study', due, steps }); toast('Добавила в дедлайны'); break; }
      // бюджет
      case 'mon': { const [y, mo] = S.ui.month.split('-').map(Number); const d = new Date(y, mo - 1 + +el.dataset.d, 1); S.ui.month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; break; }
      case 'tx': return editTx(S.budget.tx.find(x => x.id === id));
      case 'all-tx': S.ui.allTx = true; break;
      case 'goal-edit': return editGoal();
      case 'goal-add': return goalAdd();
      case 'settle': { const sb = sharedBalance(); S.budget.settled.push({ id: uid(), date: today(), amount: sb.owed }); toast('Записала расчёт'); break; }
      default: return;
    }
    save(); render();
  };
}

// ============ Формы ============
function sphereSeg(cur) { return `<div class="seg" data-name="sphere" data-value="${cur}" style="grid-auto-flow:row;grid-template-columns:repeat(${Math.min(4, S.spheres.length)},1fr)">${S.spheres.map(s => `<button type="button" data-v="${s.id}" class="${s.id === cur ? 'on' : ''}"><span class="dot" style="display:inline-block;background:${spColor(s.id)};margin-right:4px"></span>${esc(spName(s.id))}</button>`).join('')}</div>`; }

function editEvent(ev, occ, preset = {}) {
  const e = ev || { title: '', sphere: S.ui.tab === 'planner' ? 'study' : 'study', date: occ || S.ui.day, start: '10:00', end: '11:30', repeat: 'none', place: '', ...preset };
  openSheet(`<h2>${ev ? 'Событие' : 'Новое событие'}</h2>
    <div class="f"><label>Название</label><input name="title" value="${esc(e.title)}" placeholder="Пара, встреча, свидание"></div>
    <div class="f"><label>Сфера</label>${sphereSeg(e.sphere)}</div>
    <div class="g3"><div class="f"><label>Дата</label><input type="date" name="date" value="${e.repeat === 'weekly' && ev ? e.date : (occ || e.date)}"></div><div class="f"><label>С</label><input type="time" name="start" value="${e.start}"></div><div class="f"><label>До</label><input type="time" name="end" value="${e.end}"></div></div>
    <div class="f"><label>Место</label><input name="place" value="${esc(e.place || '')}" placeholder="Необязательно, например ауд. 312"></div>
    <div class="row sb t" style="margin:4px 0 14px"><span>Повторять каждую неделю</span><button type="button" class="tg ${e.repeat === 'weekly' ? 'on' : ''}" data-tgname="repeat"></button></div>
    <button class="btn acc big" data-x="save">Сохранить</button>
    ${ev ? `<div class="row" style="margin-top:8px">${ev.repeat === 'weekly' ? `<button class="btn g grow" data-x="skip">Убрать только ${dShort(occ)}</button>` : ''}<button class="btn danger grow" data-x="del">Удалить</button></div>` : ''}`, sh => {
    segInit(sh);
    sh.onclick = ev2 => {
      const x = ev2.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'save') {
        const title = val(sh, 'title').trim(); if (!title) return toast('Напиши название');
        const st = val(sh, 'start'), en = val(sh, 'end'); if (toMin(en) <= toMin(st)) return toast('Конец должен быть позже начала');
        const data = { title, sphere: segVal(sh, 'sphere'), date: val(sh, 'date') || S.ui.day, start: st, end: en, place: val(sh, 'place').trim(), repeat: $('[data-tgname=repeat]', sh).classList.contains('on') ? 'weekly' : 'none' };
        if (ev) Object.assign(ev, data); else S.events.push({ id: uid(), ...data });
        S.ui.day = data.repeat === 'weekly' && ev ? S.ui.day : data.date;
      }
      if (x === 'del') S.events = S.events.filter(z => z.id !== ev.id);
      if (x === 'skip') (ev.skip = ev.skip || []).push(occ);
      save(); closeSheet(); render();
    };
  });
}

function editDeadline(d) {
  const e = d || { title: '', sphere: S.ui.dlFilter !== 'all' ? S.ui.dlFilter : 'study', due: addDays(today(), 14), steps: [] };
  openSheet(`<h2>${d ? 'Дедлайн' : 'Новый дедлайн'}</h2>
    <div class="f"><label>Что сдать</label><input name="title" value="${esc(e.title)}" placeholder="Курсовая по маркетингу"></div>
    <div class="f"><label>Сфера</label>${sphereSeg(e.sphere)}</div>
    <div class="f"><label>Срок</label><input type="date" name="due" value="${e.due}"></div>
    <div class="f"><label>Шаги и примерное время, по одному в строке</label><textarea name="steps" placeholder="Найти источники, 2&#10;План, 0.5&#10;Глава 1, 4">${esc((e.steps || []).filter(s => !s.done).map(s => `${s.text}, ${num(s.hours)}`).join('\n'))}</textarea><span class="m s">Время в часах после запятой. По шагам посчитаю, когда пора начинать.</span></div>
    <button class="btn acc big" data-x="save">Сохранить</button>${d ? '<button class="btn danger big" style="margin-top:8px" data-x="del">Удалить</button>' : ''}`, sh => {
    segInit(sh);
    sh.onclick = ev => {
      const x = ev.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'save') {
        const title = val(sh, 'title').trim(); if (!title) return toast('Напиши, что сдать');
        const lines = val(sh, 'steps').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const m = l.match(/^(.*?)[,;]\s*([\d.,]+)\s*(ч|час.*)?$/i); return m ? { text: m[1].trim(), hours: num(m[2]) } : { text: l, hours: 1 }; });
        const kept = (e.steps || []).filter(s => s.done);
        const steps = [...kept, ...lines.map(l => ({ id: uid(), done: false, ...l }))];
        const data = { title, sphere: segVal(sh, 'sphere'), due: val(sh, 'due') || addDays(today(), 7), steps };
        if (d) Object.assign(d, data); else { const n = { id: uid(), ...data }; S.deadlines.push(n); S.ui.open[n.id] = true; }
      }
      if (x === 'del') S.deadlines = S.deadlines.filter(z => z.id !== d.id);
      save(); closeSheet(); render();
    };
  });
}

function editSubject(s) {
  const e = s ? JSON.parse(JSON.stringify(s)) : { name: '', kind: 'exam', date: '', auto: false, autoGrade: '', conds: [], rating: null };
  const condsHtml = () => e.conds.map(c => `<div class="glass" style="padding:10px;margin-bottom:6px;box-shadow:none" data-cid="${c.id}">
      <div class="row"><input class="inp" style="padding:8px 10px" value="${esc(c.title)}" data-cf="title" ${c.type === 'attend' ? 'disabled' : ''}><button class="del" data-x="cdel" data-c="${c.id}">×</button></div>
      ${c.type === 'count' ? `<div class="g3" style="margin-top:6px"><input class="inp" style="padding:8px" inputmode="numeric" value="${num(c.cur)}" data-cf="cur" placeholder="сдано"><input class="inp" style="padding:8px" inputmode="numeric" value="${num(c.total)}" data-cf="total" placeholder="всего"><input class="inp" style="padding:8px" type="date" value="${c.due || ''}" data-cf="due"></div><div class="m s" style="margin-top:3px">сдано · всего · до какого числа</div>` : ''}
      ${c.type === 'attend' ? `<div class="g3" style="margin-top:6px"><input class="inp" style="padding:8px" inputmode="numeric" value="${num(c.att)}" data-cf="att"><input class="inp" style="padding:8px" inputmode="numeric" value="${num(c.held)}" data-cf="held"><input class="inp" style="padding:8px" inputmode="numeric" value="${num(c.need)}" data-cf="need"></div><div class="m s" style="margin-top:3px">была · всего пар · нужно %</div>` : ''}
    </div>`).join('');
  openSheet(`<h2>${s ? esc(s.name) : 'Новый предмет'}</h2>
    <div class="f"><label>Предмет</label><input name="name" value="${esc(e.name)}" placeholder="Эконометрика"></div>
    <div class="g2"><div class="f"><label>Форма</label><select name="kind">${Object.entries(KIND).map(([k, n]) => `<option value="${k}" ${e.kind === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="f"><label>Дата</label><input type="date" name="date" value="${e.date || ''}"></div></div>
    <div class="row sb t" style="margin:2px 0 10px"><span><b>Уже автомат</b><div class="m s">условия можно не заполнять</div></span><button type="button" class="tg ${e.auto ? 'on' : ''}" data-tgname="auto"></button></div>
    <div class="f ${e.auto ? '' : 'hidden'}" data-autograde><label>Оценка</label><input name="autoGrade" value="${esc(e.autoGrade || '')}" placeholder="5 или «зачёт»"></div>
    <div class="f"><label>Условия допуска</label><div data-conds>${condsHtml()}</div>
      <div class="chips"><button type="button" class="chip" data-x="add-check">+ галочка</button><button type="button" class="chip" data-x="add-count">+ счётчик (лабы)</button><button type="button" class="chip" data-x="add-attend">+ посещаемость</button></div></div>
    <div class="f"><label>Рейтинг для автомата (если есть)</label><div class="g2"><input name="rcur" inputmode="numeric" value="${e.rating ? num(e.rating.cur) : ''}" placeholder="сейчас, баллов"><input name="rneed" inputmode="numeric" value="${e.rating ? num(e.rating.need) : ''}" placeholder="нужно для автомата"></div><input name="rnote" value="${esc(e.rating?.note || '')}" placeholder="Чем добрать: тест 3 (+10), презентация (+15)"></div>
    <button class="btn acc big" data-x="save">Сохранить</button>${s ? '<button class="btn danger big" style="margin-top:8px" data-x="del">Удалить предмет</button>' : ''}`, sh => {
    segInit(sh);
    $('[data-tgname=auto]', sh).addEventListener('change', ev => $('[data-autograde]', sh).classList.toggle('hidden', !ev.target.classList.contains('on')));
    const pull = () => $$('[data-cid]', sh).forEach(row => { const c = e.conds.find(z => z.id === row.dataset.cid); $$('[data-cf]', row).forEach(inp => c[inp.dataset.cf] = inp.value); });
    sh.onclick = ev => {
      const x = ev.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x.startsWith('add-') || x === 'cdel') {
        pull();
        if (x === 'add-check') e.conds.push({ id: uid(), type: 'check', title: 'Контрольная работа', done: false });
        if (x === 'add-count') e.conds.push({ id: uid(), type: 'count', title: 'Лабораторные', cur: 0, total: 5, due: '' });
        if (x === 'add-attend') { if (e.conds.some(c => c.type === 'attend')) return toast('Посещаемость уже есть'); e.conds.push({ id: uid(), type: 'attend', title: 'Посещаемость', att: 0, held: 0, need: 80 }); }
        if (x === 'cdel') e.conds = e.conds.filter(c => c.id !== ev.target.closest('[data-x]').dataset.c);
        $('[data-conds]', sh).innerHTML = condsHtml(); return;
      }
      if (x === 'save') {
        pull();
        const name = val(sh, 'name').trim(); if (!name) return toast('Напиши предмет');
        const rc = val(sh, 'rcur'), rn = val(sh, 'rneed');
        const data = { name, kind: val(sh, 'kind'), date: val(sh, 'date'), auto: $('[data-tgname=auto]', sh).classList.contains('on'), autoGrade: val(sh, 'autoGrade').trim(),
          conds: e.conds.map(c => ({ ...c, title: c.type === 'attend' ? 'Посещаемость' : (c.title || '').trim() || 'Условие' })), rating: rn ? { cur: num(rc), need: num(rn), note: val(sh, 'rnote').trim() } : null };
        if (s) Object.assign(s, data); else S.subjects.push({ id: uid(), ...data });
      }
      if (x === 'del') S.subjects = S.subjects.filter(z => z.id !== s.id);
      save(); closeSheet(); render();
    };
  });
}

function editTx(t) {
  const e = t || { type: 'out', amount: '', cat: 'Еда', note: '', date: S.ui.month === today().slice(0, 7) ? today() : S.ui.month + '-01', shared: false, paidBy: 'me' };
  openSheet(`<h2>${t ? 'Операция' : 'Новая запись'}</h2>
    <div class="seg" data-name="type" data-value="${e.type}" style="margin-bottom:12px"><button type="button" data-v="out" class="${e.type !== 'in' ? 'on' : ''}">Трата</button><button type="button" data-v="in" class="${e.type === 'in' ? 'on' : ''}">Доход</button></div>
    <div class="g2"><div class="f"><label>Сумма, ₽</label><input name="amount" inputmode="decimal" value="${e.amount}" placeholder="350"></div><div class="f"><label>Дата</label><input type="date" name="date" value="${e.date}"></div></div>
    <div class="f" data-cats><label>Категория</label><div class="chips" data-single data-name="cat" data-value="${esc(e.cat)}">${CATS.map(c => `<button type="button" class="chip ${c === e.cat ? 'on' : ''}" data-v="${c}">${c}</button>`).join('')}</div></div>
    <div class="f"><label>Комментарий</label><input name="note" value="${esc(e.note || '')}" placeholder="Кофе с Леной"></div>
    <div data-shared-box class="${e.type === 'in' ? 'hidden' : ''}"><div class="row sb t" style="margin:2px 0 8px"><span><b>Общая трата с ${esc(S.profile.partner)}ом</b><div class="m s">делится пополам</div></span><button type="button" class="tg ${e.shared ? 'on' : ''}" data-tgname="shared"></button></div>
      <div class="seg ${e.shared ? '' : 'hidden'}" data-name="paidBy" data-value="${e.paidBy || 'me'}" style="margin-bottom:12px"><button type="button" data-v="me" class="${e.paidBy !== 'partner' ? 'on' : ''}">Платила я</button><button type="button" data-v="partner" class="${e.paidBy === 'partner' ? 'on' : ''}">Платил ${esc(S.profile.partner)}</button></div></div>
    <button class="btn acc big" data-x="save">Сохранить</button>${t ? '<button class="btn danger big" style="margin-top:8px" data-x="del">Удалить</button>' : ''}`, sh => {
    segInit(sh);
    $('[data-name=type]', sh).addEventListener('click', () => setTimeout(() => { const isIn = segVal(sh, 'type') === 'in'; $('[data-shared-box]', sh).classList.toggle('hidden', isIn); $('[data-cats]', sh).classList.toggle('hidden', isIn); }));
    $('[data-tgname=shared]', sh).addEventListener('change', ev => $('[data-name=paidBy]', sh).classList.toggle('hidden', !ev.target.classList.contains('on')));
    if (e.type === 'in') $('[data-cats]', sh).classList.add('hidden');
    setTimeout(() => { if (!t) $('[name=amount]', sh).focus(); }, 250);
    sh.onclick = ev => {
      const x = ev.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'save') {
        const amount = num(val(sh, 'amount')); if (amount <= 0) return toast('Введи сумму');
        const type = segVal(sh, 'type');
        const data = { type, amount, date: val(sh, 'date') || today(), cat: type === 'in' ? 'Доход' : segVal(sh, 'cat'), note: val(sh, 'note').trim(), shared: type !== 'in' && $('[data-tgname=shared]', sh).classList.contains('on'), paidBy: segVal(sh, 'paidBy') || 'me' };
        if (t) Object.assign(t, data); else S.budget.tx.push({ id: uid(), ...data });
        S.ui.month = data.date.slice(0, 7);
      }
      if (x === 'del') S.budget.tx = S.budget.tx.filter(z => z.id !== t.id);
      save(); closeSheet(); render();
    };
  });
}

function editGoal() {
  const g = S.budget.goal || { name: '', target: '', saved: 0, deadline: '' };
  openSheet(`<h2>Цель</h2>
    <div class="f"><label>На что копишь</label><input name="name" value="${esc(g.name)}" placeholder="Стамбул"></div>
    <div class="g2"><div class="f"><label>Нужно, ₽</label><input name="target" inputmode="numeric" value="${g.target}"></div><div class="f"><label>Уже есть, ₽</label><input name="saved" inputmode="numeric" value="${g.saved}"></div></div>
    <div class="f"><label>К какой дате</label><input type="date" name="deadline" value="${g.deadline || ''}"></div>
    <button class="btn acc big" data-x="save">Сохранить</button>${S.budget.goal ? '<button class="btn danger big" style="margin-top:8px" data-x="del">Убрать цель</button>' : ''}`, sh => {
    sh.onclick = ev => {
      const x = ev.target.closest('[data-x]')?.dataset.x; if (!x) return;
      if (x === 'save') { if (!val(sh, 'name').trim() || !num(val(sh, 'target'))) return toast('Заполни цель и сумму'); S.budget.goal = { name: val(sh, 'name').trim(), target: num(val(sh, 'target')), saved: num(val(sh, 'saved')), deadline: val(sh, 'deadline') }; }
      if (x === 'del') S.budget.goal = null;
      save(); closeSheet(); render();
    };
  });
}
function goalAdd() {
  openSheet(`<h2>Пополнить «${esc(S.budget.goal.name)}»</h2><div class="f"><label>Сколько отложила, ₽</label><input name="a" inputmode="numeric" placeholder="5000"></div>
    <button class="btn acc big" data-x="ok">Пополнить</button><button class="btn g big" style="margin-top:8px" data-x="edit">Изменить цель</button>`, sh => {
    setTimeout(() => $('[name=a]', sh).focus(), 250);
    sh.onclick = ev => { const x = ev.target.closest('[data-x]')?.dataset.x; if (x === 'edit') return editGoal(); if (x !== 'ok') return; const a = num(val(sh, 'a')); if (!a) return toast('Введи сумму'); S.budget.goal.saved = num(S.budget.goal.saved) + a; save(); closeSheet(); render(); toast('Плюс ' + money(a) + ' к цели'); };
  });
}
function confirmSheet(title, text, btn, fn) {
  openSheet(`<h2>${title}</h2><p class="m t" style="margin:0 0 14px">${text}</p><button class="btn acc big" data-x="ok">${btn}</button><button class="btn g big" style="margin-top:8px" data-x="no">Отмена</button>`, sh => {
    sh.onclick = ev => { const x = ev.target.closest('[data-x]')?.dataset.x; if (x === 'ok') { closeSheet(); fn(); } if (x === 'no') closeSheet(); };
  });
}

// ---------- Настройки ----------
function settings(focus) {
  const w = S.work;
  openSheet(`<h2>Настройки</h2>
    <div class="g2"><div class="f"><label>Твоё имя</label><input name="name" value="${esc(S.profile.name)}"></div><div class="f"><label>Партнёр</label><input name="partner" value="${esc(S.profile.partner)}"></div></div>
    <div class="f"><label>Часов в неделю на каждую сферу</label>${S.spheres.map(s => `<div class="row" style="gap:10px"><span class="dot" style="background:${spColor(s.id)}"></span><span class="t" style="width:72px">${esc(spName(s.id))}</span><input type="range" min="0" max="50" value="${num(s.goal)}" data-goal="${s.id}" class="grow"><b class="t" style="width:36px;text-align:right" data-goal-l="${s.id}">${num(s.goal)} ч</b></div>`).join('')}</div>
    <div class="f" id="set-work"><label>Рабочий график</label><div class="chips" data-days>${WD.map((d, i) => `<button type="button" class="chip ${w.days.includes(i) ? 'on' : ''}" data-day="${i}">${d}</button>`).join('')}</div>
      <div class="g2" style="margin-top:6px"><input class="inp" type="time" name="wfrom" value="${w.from}"><input class="inp" type="time" name="wto" value="${w.to}"></div></div>
    <div class="f" id="set-budget"><label>Доходы в месяц</label><div data-incomes>${incomesHtml(S.budget.incomes)}</div><button type="button" class="link" data-x="inc-add">+ доход</button></div>
    <div class="f"><label>Обязательные траты в месяц</label><div data-fixed>${incomesHtml(S.budget.fixed, 'fixed')}</div><button type="button" class="link" data-x="fix-add">+ трата</button></div>
    <div class="f"><label>Тема</label><div class="seg" data-name="theme" data-value="${S.theme}"><button type="button" data-v="auto" class="${S.theme === 'auto' ? 'on' : ''}">Авто</button><button type="button" data-v="light" class="${S.theme === 'light' ? 'on' : ''}">Светлая</button><button type="button" data-v="dark" class="${S.theme === 'dark' ? 'on' : ''}">Тёмная</button></div></div>
    <button class="btn acc big" data-x="save">Сохранить</button>
    <div class="m s" style="margin:12px 0 0;text-align:center">${cloud.status === 'on' ? 'Данные сохраняются в облаке и доступны с любого устройства через бота' : cloud.status === 'error' ? 'Нет связи с облаком, данные пока сохраняются на этом устройстве' : 'Открой приложение через бота, чтобы данные сохранялись в облаке'}</div>
    <div class="g2" style="margin-top:10px"><button class="btn g" data-x="export">Скачать копию данных</button><button class="btn g" data-x="import">Загрузить копию</button></div>
    <button class="btn g big" style="margin-top:8px" data-x="onb">Пройти приветствие заново</button>
    <button class="btn danger big" style="margin-top:8px" data-x="reset">Стереть всё</button>
    <input type="file" accept="application/json" class="hidden" data-file>`, sh => {
    segInit(sh);
    $$('[data-goal]', sh).forEach(r => r.oninput = () => { $(`[data-goal-l="${r.dataset.goal}"]`, sh).textContent = r.value + ' ч'; });
    $('[data-days]', sh).onclick = ev => { const b = ev.target.closest('[data-day]'); if (b) b.classList.toggle('on'); };
    const tmp = { incomes: JSON.parse(JSON.stringify(S.budget.incomes)), fixed: JSON.parse(JSON.stringify(S.budget.fixed)) };
    const pull = () => ['incomes', 'fixed'].forEach(k => $$(`[data-${k === 'fixed' ? 'fixed' : 'incomes'}] [data-rid]`, sh).forEach(r => { const it = tmp[k].find(z => z.id === r.dataset.rid); if (it) { it.name = $('[data-k=name]', r).value; it.amount = num($('[data-k=amount]', r).value); } }));
    if (focus) setTimeout(() => $('#set-' + focus, sh)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 280);
    sh.onclick = ev => {
      const btn = ev.target.closest('[data-x]'); const x = btn?.dataset.x; if (!x) return;
      if (x === 'inc-add' || x === 'fix-add' || x === 'rdel') {
        pull();
        if (x === 'inc-add') tmp.incomes.push({ id: uid(), name: tmp.incomes.length ? 'Подработка' : 'Зарплата', amount: '' });
        if (x === 'fix-add') tmp.fixed.push({ id: uid(), name: 'Аренда', amount: '' });
        if (x === 'rdel') { tmp.incomes = tmp.incomes.filter(z => z.id !== btn.dataset.r); tmp.fixed = tmp.fixed.filter(z => z.id !== btn.dataset.r); }
        $('[data-incomes]', sh).innerHTML = incomesHtml(tmp.incomes); $('[data-fixed]', sh).innerHTML = incomesHtml(tmp.fixed, 'fixed'); return;
      }
      if (x === 'save') {
        pull();
        S.profile.name = val(sh, 'name').trim(); S.profile.partner = val(sh, 'partner').trim() || 'Партнёр';
        $$('[data-goal]', sh).forEach(r => sp(r.dataset.goal).goal = +r.value);
        S.work.days = $$('[data-day].on', sh).map(b => +b.dataset.day); S.work.from = val(sh, 'wfrom'); S.work.to = val(sh, 'wto');
        S.budget.incomes = tmp.incomes.filter(i => i.name || i.amount); S.budget.fixed = tmp.fixed.filter(i => i.name || i.amount);
        S.theme = segVal(sh, 'theme') || 'auto';
        save(); closeSheet(); render(); toast('Сохранено'); return;
      }
      if (x === 'export') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `tri-zhizni-${today()}.json`; a.click(); return; }
      if (x === 'import') { const f = $('[data-file]', sh); f.onchange = async () => { try { const d = JSON.parse(await f.files[0].text()); if (!d.spheres) throw 0; S = Object.assign(blank(), d); save(); closeSheet(); render(); toast('Данные загружены'); } catch (_) { toast('Это не похоже на копию данных'); } }; f.click(); return; }
      if (x === 'onb') { S.onboarded = false; onbStep = 0; save(); closeSheet(); render(); return; }
      if (x === 'reset') return confirmSheet('Стереть всё?', 'Удалятся все события, дедлайны, предметы и траты на этом устройстве. Сначала можно скачать копию.', 'Стереть', () => { localStorage.removeItem(KEY); S = blank(); onbStep = 0; save(); render(); });
    };
  });
}
function incomesHtml(list, kind) {
  return list.map(i => `<div class="row" style="margin-bottom:6px" data-rid="${i.id}"><input class="inp grow" data-k="name" value="${esc(i.name)}" placeholder="${kind === 'fixed' ? 'Аренда' : 'Зарплата'}"><input class="inp" style="width:110px" data-k="amount" inputmode="numeric" value="${i.amount}" placeholder="₽"><button type="button" class="del" data-x="rdel" data-r="${i.id}">×</button></div>`).join('') || `<div class="m s" style="margin-bottom:4px">${kind === 'fixed' ? 'Аренда, связь, подписки' : 'Пока нет'}</div>`;
}

// ============ Приветствие ============
let onbStep = 0;
const ONB_N = 5;
const onbIco = (k, bg, fg) => `<span class="ico" style="background:${bg};color:${fg}">${ic(k)}</span>`;
function renderOnb() {
  const st = onbStep, prog = st ? `<div class="prog">${[...Array(ONB_N)].map((_, i) => `<span class="${i < st ? 'on' : ''}"></span>`).join('')}</div><div class="m s">шаг ${st} из ${ONB_N}</div>` : '';
  let body = '', cta = 'Дальше', skip = 'Пропустить';
  if (st === 0) {
    const nm = S.profile.name;
    body = `<div style="margin-top:30px;width:64px;height:64px;border-radius:20px;background:var(--accent-soft);display:grid;place-items:center;color:var(--accent)">${ic('three').replace('class="ic"', 'class="ic" style="width:32px;height:32px"')}</div>
      <h1>${nm ? `Привет, ${esc(nm)}` : 'Привет!'}</h1>
      <div class="m t" style="line-height:1.5">Учёба, работа и любимый человек в одном месте. Настроим всё за пару минут, любой шаг можно пропустить.</div>
      <div class="glass" style="margin-top:16px;display:grid;gap:12px">
        <div class="row">${onbIco('cal', 'var(--blue-s)', 'var(--blue-ink)')}<div><b class="t">Планер</b><div class="m s">баланс времени между сферами</div></div></div>
        <div class="row">${onbIco('clock', 'var(--warm)', 'var(--warm-ink)')}<div><b class="t">Дедлайны</b><div class="m s">когда начинать, чтобы успеть</div></div></div>
        <div class="row">${onbIco('cap', 'var(--accent-soft)', 'var(--accent)')}<div><b class="t">Учёба</b><div class="m s">допуски и автоматы к сессии</div></div></div>
        <div class="row">${onbIco('wallet', 'var(--rose)', 'var(--rose-ink)')}<div><b class="t">Бюджет</b><div class="m s">сколько можно тратить в день</div></div></div>
      </div>
      <div class="glass green" style="margin-top:10px"><div class="row">${onbIco('heart', 'var(--card-solid)', 'var(--accent)')}<div class="t"><b>Скоро: связь с Duo</b><div class="m s">общие события и траты подтянутся сами</div></div></div></div>`;
    cta = 'Начать настройку'; skip = 'Сначала посмотрю на примере';
  }
  if (st === 1) {
    body = `<h1>Сколько времени в неделю хочешь на каждое?</h1><div class="m s">Планер будет подсказывать, если что-то проседает</div>
      <div class="f" style="margin-top:14px"><label>Как зовут твоего человека</label><input name="partner" value="${esc(S.profile.partner)}"></div>
      <div class="glass" style="display:grid;gap:14px">${S.spheres.map(s => `<div><div class="row sb t"><span class="row"><span class="dot" style="background:${spColor(s.id)}"></span><span data-spname="${s.id}">${esc(spName(s.id))}</span></span><b data-goal-l="${s.id}">${num(s.goal)} ч</b></div><input type="range" min="0" max="50" value="${num(s.goal)}" data-goal="${s.id}"></div>`).join('')}</div>`;
  }
  if (st === 2) {
    body = `<h1>Учёба и сессия</h1>
      <div class="lbl">РАСПИСАНИЕ ПАР</div>
      <div class="glass"><div class="row">${onbIco('link', 'var(--blue-s)', 'var(--blue-ink)')}<div class="grow"><b class="t">Ссылка на расписание</b><div class="m s">сохраню её, а автоматический импорт подключим вместе с ботом</div></div></div>
        <input class="inp" style="margin-top:10px" name="sched" value="${esc(S.schedule.url)}" placeholder="ссылка на расписание группы"><div class="m s" style="margin-top:6px">Пока можно добавить пары вручную в планере с повтором каждую неделю</div></div>
      <div class="lbl">ПРЕДМЕТЫ ЭТОЙ СЕССИИ</div>
      <div class="glass" style="padding:6px 14px"><div class="list" data-onb-subj>${onbSubj()}</div>
        <div class="row" style="padding:8px 0;border-top:1px solid var(--line)"><input class="inp" name="newsubj" placeholder="Название предмета"><button type="button" class="btn g" data-o="addsubj">+</button></div></div>
      <div class="m s" style="margin-top:10px">Условия допуска к каждому предмету добавишь во вкладке «Учёба», когда узнаешь их у преподавателя</div>`;
  }
  if (st === 3) {
    const w = S.work;
    body = `<h1>Работа</h1><div class="lbl">ОБЫЧНЫЙ ГРАФИК</div>
      <div class="glass"><div class="chips" data-days>${WD.map((d, i) => `<button type="button" class="chip ${w.days.includes(i) ? 'on' : ''}" data-day="${i}">${d}</button>`).join('')}</div>
        <div class="g2" style="margin-top:10px"><div class="f" style="margin:0"><label>с</label><input type="time" name="wfrom" value="${w.from}"></div><div class="f" style="margin:0"><label>до</label><input type="time" name="wto" value="${w.to}"></div></div>
        <div class="row sb t" style="margin-top:12px"><span>Гибрид, часть дней из дома</span><button type="button" class="tg ${w.hybrid ? 'on' : ''}" data-tgname="hybrid"></button></div></div>
      <div class="lbl">РАБОЧИЙ КАЛЕНДАРЬ</div>
      <div class="glass"><div class="row">${onbIco('brief', 'var(--warm)', 'var(--warm-ink)')}<div class="grow"><b class="t">Outlook или Google</b><div class="m s">подключим на следующем этапе, встречи будут попадать в планер сами</div></div></div></div>
      <div class="glass warm" style="margin-top:10px"><div class="row sb"><div class="t"><b>Напомнить про сессию на работе?</b><div class="m s" style="margin-top:2px">За месяц до первого экзамена подскажу договориться о свободных днях</div></div><button type="button" class="tg ${w.remindSession ? 'on' : ''}" data-tgname="remind"></button></div></div>`;
  }
  if (st === 4) {
    const inc = S.budget.incomes, sal = inc.find(i => /зарп/i.test(i.name)), sti = inc.find(i => /стип/i.test(i.name)), rent = S.budget.fixed.find(i => /аренд/i.test(i.name));
    body = `<h1>Бюджет</h1><div class="lbl">ДОХОДЫ В МЕСЯЦ</div>
      <div class="glass" style="display:grid;gap:8px"><div class="f" style="margin:0"><label>Зарплата, ₽</label><input name="sal" inputmode="numeric" value="${sal ? sal.amount : ''}" placeholder="58 000"></div><div class="f" style="margin:0"><label>Стипендия, ₽</label><input name="sti" inputmode="numeric" value="${sti ? sti.amount : ''}" placeholder="0, если нет"></div></div>
      <div class="lbl">ОБЯЗАТЕЛЬНЫЕ ТРАТЫ</div>
      <div class="glass"><div class="f" style="margin:0"><label>Аренда или общежитие, ₽</label><input name="rent" inputmode="numeric" value="${rent ? rent.amount : ''}" placeholder="0, если нет"></div><div class="m s" style="margin-top:6px">Остальные постоянные траты добавишь в настройках</div></div>
      <div class="glass green" style="margin-top:10px"><div class="row sb t"><span><b>Общее с ${esc(S.profile.partner)}ом из Duo</b><div class="m s">включим, когда подключим базу Duo. Личные траты партнёр не увидит</div></span><button type="button" class="tg ${S.budget.fromDuo ? 'on' : ''}" data-tgname="duo"></button></div></div>`;
  }
  if (st === 5) {
    const n = S.notify;
    const row = (k, t, d) => `<div class="row sb"><span><b class="t">${t}</b><div class="m s">${d}</div></span><button type="button" class="tg ${n[k] ? 'on' : ''}" data-n="${k}"></button></div>`;
    body = `<h1>Что присылать в Telegram?</h1><div class="m s">Запомню выбор, бот начнёт писать, когда мы его подключим</div>
      <div class="glass list" style="margin-top:14px;padding:4px 14px">
        ${row('morning', 'Утренняя сводка', 'пары, работа, сроки на сегодня')}${row('attendance', 'Посещаемость', '«Была на паре?» после каждой пары')}${row('startNow', 'Пора начинать', 'когда подходит срок начать дедлайн')}${row('weekly', 'Итог недели', 'воскресенье вечером')}${row('spend', 'Траты за день', 'вечером, если ничего не записала')}
      </div>
      <div class="glass" style="margin-top:10px"><b class="t">Можно будет писать боту как подруге</b><div style="display:grid;gap:6px;margin-top:8px"><div class="row"><span class="pill green" style="font-size:11.5px;padding:6px 10px">кофе 350</span><span class="m s">→ трата</span></div><div class="row"><span class="pill green" style="font-size:11.5px;padding:6px 10px">эссе до 6.11</span><span class="m s">→ дедлайн</span></div></div></div>`;
    cta = 'Готово'; skip = '';
  }
  return `<div class="onb">${prog}${body}</div><div class="onb-cta"><button class="btn acc big" data-o="next">${cta}</button>${skip ? `<button class="link" style="justify-self:center;color:var(--muted)" data-o="skip">${skip}</button>` : ''}${st ? `<button class="link" style="justify-self:center;color:var(--muted);margin-top:-4px" data-o="back">Назад</button>` : ''}</div>`;
}
function onbSubj() {
  return S.subjects.map(s => `<div class="row sb"><span class="t wrapt grow">${esc(s.name)}</span><span class="row" style="gap:4px">${['exam', 'credit'].map(k => `<button type="button" class="chip ${s.kind === k && !s.auto ? 'on' : ''}" style="padding:4px 9px" data-o="kind" data-id="${s.id}" data-k="${k}">${KIND[k]}</button>`).join('')}<button type="button" class="chip" style="padding:4px 9px;${s.auto ? 'background:var(--accent);color:#fff' : ''}" data-o="auto" data-id="${s.id}">автомат${s.auto ? ' ✓' : ''}</button></span></div>`).join('') || '<div class="empty">Добавь предметы, которые будут в сессию</div>';
}
function collectOnb() {
  const a = $('#app');
  if (onbStep === 1) { const p = $('[name=partner]', a); if (p) S.profile.partner = p.value.trim() || 'Партнёр'; $$('[data-goal]', a).forEach(r => sp(r.dataset.goal).goal = +r.value); sp('love').name = S.profile.partner; }
  if (onbStep === 2) { S.schedule.url = ($('[name=sched]', a)?.value || '').trim(); }
  if (onbStep === 3) { S.work.days = $$('[data-day].on', a).map(b => +b.dataset.day); S.work.from = $('[name=wfrom]', a).value; S.work.to = $('[name=wto]', a).value; S.work.hybrid = $('[data-tgname=hybrid]', a).classList.contains('on'); S.work.remindSession = $('[data-tgname=remind]', a).classList.contains('on'); }
  if (onbStep === 4) {
    const set = (list, re, name, v) => { const n = num(v); const it = list.find(i => re.test(i.name)); if (n > 0) { if (it) it.amount = n; else list.push({ id: uid(), name, amount: n }); } else if (it) list.splice(list.indexOf(it), 1); };
    set(S.budget.incomes, /зарп/i, 'Зарплата', $('[name=sal]', a).value); set(S.budget.incomes, /стип/i, 'Стипендия', $('[name=sti]', a).value); set(S.budget.fixed, /аренд/i, 'Аренда', $('[name=rent]', a).value);
    S.budget.fromDuo = $('[data-tgname=duo]', a).classList.contains('on');
  }
  if (onbStep === 5) $$('[data-n]', a).forEach(t => S.notify[t.dataset.n] = t.classList.contains('on'));
}
function mountOnb() {
  const a = $('#app'); segInit(a);
  $$('[data-goal]', a).forEach(r => r.oninput = () => { $(`[data-goal-l="${r.dataset.goal}"]`, a).textContent = r.value + ' ч'; });
  const pn = $('[name=partner]', a); if (pn) pn.oninput = () => { const l = $('[data-spname=love]', a); if (l) l.textContent = pn.value || 'Партнёр'; };
  const days = $('[data-days]', a); if (days) days.onclick = ev => { const b = ev.target.closest('[data-day]'); if (b) { b.classList.toggle('on'); haptic(); } };
  const ns = $('[name=newsubj]', a); if (ns) ns.onkeydown = ev => { if (ev.key === 'Enter') $('[data-o=addsubj]', a).click(); };
  a.onclick = ev => {
    const b = ev.target.closest('[data-o]'); if (!b) return;
    const o = b.dataset.o;
    if (o === 'addsubj') { const v = ns.value.trim(); if (!v) return ns.focus(); S.subjects.push({ id: uid(), name: v, kind: 'exam', date: '', auto: false, autoGrade: '', conds: [], rating: null }); ns.value = ''; $('[data-onb-subj]', a).innerHTML = onbSubj(); ns.focus(); save(); return; }
    if (o === 'kind' || o === 'auto') { const s = S.subjects.find(x => x.id === b.dataset.id); if (o === 'kind') { s.kind = b.dataset.k; s.auto = false; } else s.auto = !s.auto; $('[data-onb-subj]', a).innerHTML = onbSubj(); save(); haptic(); return; }
    if (o === 'skip' && onbStep === 0) { S = demoState(); save(); render(); scrollTo(0, 0); return; }
    if (o === 'back') { collectOnb(); onbStep--; save(); render(); scrollTo(0, 0); return; }
    if (o === 'next' && onbStep > 0) collectOnb();
    if (onbStep >= ONB_N) { S.onboarded = true; S.ui.tab = 'planner'; save(); render(); scrollTo(0, 0); toast('Готово! Добавь первые дела через «+»'); return; }
    onbStep++; haptic(); save(); render(); scrollTo(0, 0);
  };
}

// ============ Пример (демо) ============
function demoState() {
  const s = blank(); s.onboarded = true; s.demo = true; s.profile.name = S.profile.name || 'Вероника';
  const t = today(), ws = weekStart(t), d = i => addDays(ws, i);
  s.budget.incomes = [{ id: uid(), name: 'Зарплата', amount: 58000 }, { id: uid(), name: 'Стипендия', amount: 10000 }];
  s.budget.fixed = [{ id: uid(), name: 'Аренда', amount: 20000 }];
  s.events = [
    { id: uid(), title: 'Эконометрика', sphere: 'study', date: d(0), start: '09:30', end: '11:00', repeat: 'weekly', place: 'ауд. 312' },
    { id: uid(), title: 'Маркетинг', sphere: 'study', date: d(1), start: '10:00', end: '11:30', repeat: 'weekly', place: 'ауд. 204' },
    { id: uid(), title: 'Философия, семинар', sphere: 'study', date: d(3), start: '19:30', end: '21:00', repeat: 'weekly' },
    { id: uid(), title: 'Английский', sphere: 'study', date: d(2), start: '11:40', end: '13:10', repeat: 'weekly' },
    { id: uid(), title: 'Созвон с командой', sphere: 'work', date: d(3), start: '10:00', end: '12:00', repeat: 'none' },
    { id: uid(), title: 'Ужин с Максимом', sphere: 'love', date: d(1), start: '19:30', end: '22:00', repeat: 'none' },
    { id: uid(), title: 'Кино', sphere: 'love', date: d(5), start: '18:00', end: '21:00', repeat: 'none' },
    { id: uid(), title: 'Йога', sphere: 'me', date: d(2), start: '08:00', end: '09:00', repeat: 'weekly' },
    { id: uid(), title: 'Выходной для себя', sphere: 'me', date: d(6), start: '12:00', end: '15:00', repeat: 'none' },
  ];
  s.deadlines = [
    { id: uid(), title: 'Отчёт Q3 руководителю', sphere: 'work', due: addDays(t, -2), steps: [{ id: uid(), text: 'Собрать цифры', hours: 2, done: true }, { id: uid(), text: 'Графики', hours: 2, done: true }, { id: uid(), text: 'Черновик', hours: 2, done: true }, { id: uid(), text: 'Выводы и слайд', hours: 1, done: false }] },
    { id: uid(), title: 'Курсовая по маркетингу', sphere: 'study', due: addDays(t, 13), steps: [{ id: uid(), text: 'Найти 10 источников', hours: 2, done: true }, { id: uid(), text: 'План из 5 пунктов', hours: .5, done: false }, { id: uid(), text: 'Глава 1: теория', hours: 4, done: false }, { id: uid(), text: 'Глава 2: анализ', hours: 6, done: false }, { id: uid(), text: 'Оформление', hours: 2, done: false }] },
    { id: uid(), title: 'Презентация для клиента', sphere: 'work', due: addDays(t, 10), steps: [{ id: uid(), text: 'Структура', hours: 1, done: true }, { id: uid(), text: 'Слайды', hours: 3, done: false }, { id: uid(), text: 'Прогон', hours: 1, done: false }] },
    { id: uid(), title: 'Эссе по философии', sphere: 'study', due: addDays(t, 10), steps: [{ id: uid(), text: 'Выбрать тему', hours: .5, done: false }, { id: uid(), text: 'Написать', hours: 4, done: false }] },
    { id: uid(), title: 'Подарок на годовщину', sphere: 'love', due: addDays(t, 8), steps: [{ id: uid(), text: 'Идеи', hours: .5, done: true }, { id: uid(), text: 'Заказать', hours: .5, done: false }, { id: uid(), text: 'Открытка', hours: 1, done: false }] },
  ];
  s.subjects = [
    { id: uid(), name: 'Эконометрика', kind: 'exam', date: addDays(t, 77), auto: false, conds: [{ id: uid(), type: 'check', title: 'Контрольная работа', done: true, note: 'сдана, 4' }, { id: uid(), type: 'check', title: 'Тема курсового проекта', done: true }, { id: uid(), type: 'count', title: 'Лабораторные', cur: 3, total: 5, due: addDays(t, 28) }, { id: uid(), type: 'attend', title: 'Посещаемость', att: 17, held: 23, need: 80 }], rating: null },
    { id: uid(), name: 'Английский', kind: 'credit', date: addDays(t, 70), auto: false, conds: [{ id: uid(), type: 'check', title: 'Эссе', done: true }], rating: { cur: 64, need: 85, note: 'Тест 3 (+10) и презентация (+15) закроют автомат' } },
    { id: uid(), name: 'Маркетинг', kind: 'exam', date: addDays(t, 80), auto: true, autoGrade: '5', conds: [], rating: null },
    { id: uid(), name: 'Статистика', kind: 'credit', date: addDays(t, 72), auto: true, autoGrade: 'зачёт', conds: [], rating: null },
    { id: uid(), name: 'Философия', kind: 'exam', date: addDays(t, 84), auto: false, conds: [{ id: uid(), type: 'check', title: 'Реферат', done: true }], rating: null },
    { id: uid(), name: 'Финансы', kind: 'exam', date: addDays(t, 81), auto: false, conds: [{ id: uid(), type: 'count', title: 'Домашние задания', cur: 6, total: 8, due: addDays(t, 40) }], rating: null },
  ];
  const m = t.slice(0, 7), pm = prevMonth(m), dd = n => `${m}-${pad(clamp(n, 1, new Date().getDate()))}`;
  s.budget.tx = [
    { id: uid(), type: 'out', amount: 9400, cat: 'Еда', note: 'Продукты за месяц', date: dd(3) },
    { id: uid(), type: 'out', amount: 3800, cat: 'Кафе', note: 'Кофе и обеды', date: dd(8) },
    { id: uid(), type: 'out', amount: 2700, cat: 'Одежда', note: 'Свитер', date: dd(12) },
    { id: uid(), type: 'out', amount: 2400, cat: 'Транспорт', note: 'Проездной', date: dd(1) },
    { id: uid(), type: 'out', amount: 3100, cat: 'Развлечения', note: 'Ресторан', date: dd(15), shared: true, paidBy: 'me' },
    { id: uid(), type: 'out', amount: 1900, cat: 'Развлечения', note: 'Боулинг', date: dd(20), shared: true, paidBy: 'partner' },
    { id: uid(), type: 'out', amount: 1300, cat: 'Развлечения', note: 'Кино, попкорн', date: dd(26), shared: true, paidBy: 'me' },
    { id: uid(), type: 'out', amount: 2600, cat: 'Кафе', note: 'Кафе', date: `${pm}-10` },
  ];
  s.budget.goal = { name: 'Стамбул', target: 90000, saved: 62000, deadline: addDays(t, 135) };
  s.ui.day = t;
  return s;
}

// ============ Старт ============
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
cloudInit();
