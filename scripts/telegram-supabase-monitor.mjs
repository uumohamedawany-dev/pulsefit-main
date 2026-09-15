import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xrpxpvlsrdcnhydozywj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_X2P3Wj9qrdSzGUiyP_aRAQ_1skhLMay';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6317044028';
const PAYMENTS_BOT_TOKEN = process.env.PAYMENTS_BOT_TOKEN || '8607034708:AAHHy-9ikOcpZweQJF__OEQnKsRxmjvSZsE';
const MALES_BOT_TOKEN = process.env.MALES_BOT_TOKEN || '8952414603:AAHsN2Cxd986dmeRsMn8kAwZdFjDPbMHHUw';
const FEMALES_BOT_TOKEN = process.env.FEMALES_BOT_TOKEN || '8980012838:AAF7zwms95Xjx3fBB6AZQ-cRdx2qBlJRiyY';
const REPORT_INTERVAL_MS = Number(process.env.REPORT_INTERVAL_MS || 60 * 60 * 1000);
const REQUEST_TIMEOUT_MS = 10_000;

if (!SUPABASE_URL || !SUPABASE_KEY || !CHAT_ID) {
  throw new Error('SUPABASE_URL, SUPABASE_KEY, and TELEGRAM_CHAT_ID are required.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function escapeTelegram(value) {
  return String(value ?? 'غير محدد').replace(/[<>]/g, '');
}

function formatUser(user = {}) {
  return [
    `🆔 ${escapeTelegram(user.publicUserId || user.user_id)}`,
    `👤 ${escapeTelegram(user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim())}`,
    `📧 ${escapeTelegram(user.email)}`,
    `📍 ${escapeTelegram(user.governorate)}`,
  ].join('\n');
}

function formatPayment(payment = {}) {
  return [
    `💳 الخطة: ${escapeTelegram(payment.plan)}`,
    `💰 المبلغ: ${escapeTelegram(payment.amount)} جنيه`,
    `📧 ${escapeTelegram(payment.email)}`,
    `📌 الحالة: ${escapeTelegram(payment.status)}`,
    `🕐 ${escapeTelegram(payment.created_at)}`,
  ].join('\n');
}

async function sendTelegram(botToken, text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error(`[telegram] HTTP ${response.status}: ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[telegram] dispatch failed:', error instanceof Error ? error.message : error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWithRetry(botToken, text) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (await sendTelegram(botToken, text)) return true;
    await sleep(attempt * 1500);
  }
  return false;
}

async function fetchHourlySummary() {
  const since = new Date(Date.now() - REPORT_INTERVAL_MS).toISOString();
  const [{ data: users, error: usersError }, { data: payments, error: paymentsError }] = await Promise.all([
    supabase.from('users_data').select('*').or(`created_at.gte.${since},updated_at.gte.${since}`),
    supabase.from('payments').select('*').or(`created_at.gte.${since},updated_at.gte.${since}`),
  ]);

  if (usersError) throw usersError;
  if (paymentsError) throw paymentsError;

  return { users: users || [], payments: payments || [], since };
}

async function sendHourlyReports() {
  try {
    const { users, payments, since } = await fetchHourlySummary();
    const males = users.filter((user) => user.gender === 'male');
    const females = users.filter((user) => user.gender === 'female');

    await Promise.all([
      sendWithRetry(PAYMENTS_BOT_TOKEN, `🔔 تقرير المدفوعات الساعي\nمنذ: ${since}\n\n${payments.length ? payments.map(formatPayment).join('\n\n') : 'لا توجد مدفوعات جديدة.'}`),
      sendWithRetry(MALES_BOT_TOKEN, `📊 تقرير الشباب الساعي\nمنذ: ${since}\n👥 تسجيلات جديدة: ${males.length}\n\n${males.length ? males.map(formatUser).join('\n\n') : 'لا توجد تسجيلات جديدة.'}`),
      sendWithRetry(FEMALES_BOT_TOKEN, `📊 تقرير البنات الساعي\nمنذ: ${since}\n👥 تسجيلات جديدة: ${females.length}\n🧊 حالات تجميد الاستريك: ${females.filter((user) => user.streak_frozen).length}\n\n${females.length ? females.map(formatUser).join('\n\n') : 'لا توجد تسجيلات جديدة.'}`),
    ]);
  } catch (error) {
    console.error('[hourly-summary] failed:', error instanceof Error ? error.message : error);
  }
}

function startRealtimeSubscriptions() {
  const channel = supabase
    .channel('pulsefit-telegram-monitor')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, ({ eventType, new: payment }) => {
      void sendWithRetry(PAYMENTS_BOT_TOKEN, `🔔 تحديث دفع جديد\nالحدث: ${eventType}\n\n${formatPayment(payment)}`);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users_data', filter: 'gender=eq.male' }, ({ eventType, new: user }) => {
      void sendWithRetry(MALES_BOT_TOKEN, `👤 تحديث مستخدم ولد\nالحدث: ${eventType}\n\n${formatUser(user)}`);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users_data', filter: 'gender=eq.female' }, ({ eventType, new: user }) => {
      void sendWithRetry(FEMALES_BOT_TOKEN, `👩 تحديث مستخدمة بنت\nالحدث: ${eventType}\n\n${formatUser(user)}\n🧊 تجميد الاستريك: ${user.streak_frozen ? 'نعم' : 'لا'}`);
    })
    .subscribe((status) => console.log(`[supabase-realtime] ${status}`));

  return channel;
}

console.log('[pulsefit-monitor] starting cloud Telegram monitor');
console.log(`[pulsefit-monitor] Supabase: ${SUPABASE_URL}`);
console.log(`[pulsefit-monitor] report interval: ${REPORT_INTERVAL_MS}ms`);

startRealtimeSubscriptions();
void sendHourlyReports();
setInterval(() => void sendHourlyReports(), REPORT_INTERVAL_MS);
