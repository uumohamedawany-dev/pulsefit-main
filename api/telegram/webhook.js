import { createClient } from '@supabase/supabase-js';

function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function config(request) {
  const bot = request.query?.bot === 'female' ? 'female' : request.query?.bot === 'male' ? 'male' : 'default';
  return { bot, url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, ''), serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '', botToken: bot === 'male' ? process.env.PULSEFIT_BOYS_BOT_TOKEN || '' : bot === 'female' ? process.env.PULSEFIT_GIRLS_BOT_TOKEN || '' : process.env.TELEGRAM_BOT_TOKEN || '', chatId: String(process.env.TELEGRAM_CHAT_ID || '') };
}

async function telegram(botToken, method, payload) {
  const result = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return result.json();
}

async function answerCallback(botToken, callbackId, text) {
  if (botToken && callbackId) await telegram(botToken, 'answerCallbackQuery', { callback_query_id: callbackId, text, show_alert: false });
}

async function findUser(admin, identifier) {
  const normalized = String(identifier || '').trim();
  for (const column of ['user_id', 'public_user_id', 'email']) {
    const { data } = await admin.from('users_data').select('*').eq(column, normalized).maybeSingle();
    if (data) return data;
  }
  return null;
}

function profileText(user) {
  return [`👤 ${[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User'}`, `🆔 ${user.public_user_id || user.user_id}`, `📧 ${user.email}`, `🎂 Age: ${user.age ?? 0}`, `📏 Height: ${user.height ?? 0} cm`, `⚖️ Weight: ${user.weight ?? 0} kg`, `📍 Governorate: ${user.governorate || 'Not provided'}`, `🔥 Streak: ${user.streak_days ?? 0}`, `⭐ Status: ${user.account_status || user.subscription_status || 'active'}`].join('\n');
}

async function showUserPanel(admin, botToken, chatId, identifier) {
  const user = await findUser(admin, identifier);
  if (!user) return telegram(botToken, 'sendMessage', { chat_id: chatId, text: `User not found: ${identifier}` });
  const id = user.user_id;
  return telegram(botToken, 'sendMessage', { chat_id: chatId, text: profileText(user), reply_markup: { inline_keyboard: [[{ text: '✉️ Send Message (أبعتله رسالة)', callback_data: `user_msg_${id}` }], [{ text: '🎁 Give Pro Gift', callback_data: `gift_menu_${id}` }, { text: '🚫 Suspend User', callback_data: `suspend_menu_${id}` }]] } });
}

async function addNotification(admin, userId, title, message) {
  await admin.from('notifications').insert({ user_id: userId, title, message, type: 'system', read: false });
}

async function handleAdminCallback(admin, botToken, callback, chatId) {
  const data = String(callback.data || '');
  const paymentAction = data.match(/^(approve|decline)_([0-9a-f-]+)_(\d+)$/i);
  const giftMenu = data.match(/^gift_menu_([0-9a-f-]+)$/i);
  const suspendMenu = data.match(/^suspend_menu_([0-9a-f-]+)$/i);
  const gift = data.match(/^gift_(\d+)_([0-9a-f-]+)$/i);
  const suspend = data.match(/^suspend_(\d+)_([0-9a-f-]+)$/i);
  const message = data.match(/^user_msg_([0-9a-f-]+)$/i);

  if (paymentAction) {
    const [, action, userId, paymentIdText] = paymentAction;
    const paymentId = Number(paymentIdText);
    const { data: payment, error: paymentLookupError } = await admin.from('payments').select('id, user_id, plan').eq('id', paymentId).maybeSingle();
    if (paymentLookupError) throw paymentLookupError;
    if (!payment || payment.user_id !== userId) return answerCallback(botToken, callback.id, 'Request not found.');
    const status = action.toLowerCase() === 'approve' ? 'approved' : 'declined';
    const { error: paymentUpdateError } = await admin.from('payments').update({ status, reviewed_at: new Date().toISOString() }).eq('id', paymentId);
    if (paymentUpdateError) throw paymentUpdateError;
    if (status === 'approved') {
      const expiresAt = payment.plan === 'lifetime' ? null : new Date(Date.now() + (payment.plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
      const { error: profileError } = await admin.from('users_data').update({ subscription_status: 'active', subscription_plan: payment.plan, subscription_expires_at: expiresAt, updated_at: new Date().toISOString() }).eq('user_id', userId);
      if (profileError) throw profileError;
    }
    await answerCallback(botToken, callback.id, status === 'approved' ? 'Approved and upgraded to Pro.' : 'Declined for re-upload.');
    if (callback.message?.message_id) await telegram(botToken, 'editMessageReplyMarkup', { chat_id: chatId, message_id: callback.message.message_id, reply_markup: { inline_keyboard: [] } });
    return;
  }

  if (giftMenu) {
    await answerCallback(botToken, callback.id, 'Choose gift duration.');
    return telegram(botToken, 'sendMessage', { chat_id: chatId, text: 'Choose Pro gift duration:', reply_markup: { inline_keyboard: [[7, 15, 30].map((days) => ({ text: `${days} days`, callback_data: `gift_${days}_${giftMenu[1]}` }))] } });
  }
  if (suspendMenu) {
    await answerCallback(botToken, callback.id, 'Choose suspension duration.');
    return telegram(botToken, 'sendMessage', { chat_id: chatId, text: 'Choose suspension duration:', reply_markup: { inline_keyboard: [[1, 7, 30].map((days) => ({ text: `${days} days`, callback_data: `suspend_${days}_${suspendMenu[1]}` }))] } });
  }
  if (message) return answerCallback(botToken, callback.id, 'Use /msg USER_ID your message.');
  if (!gift && !suspend) return answerCallback(botToken, callback.id, 'Unknown action.');

  const isGift = Boolean(gift);
  const days = Number((gift || suspend)[1]);
  const userId = (gift || suspend)[2];
  const { data: user } = await admin.from('users_data').select('email').eq('user_id', userId).maybeSingle();
  if (!user) return answerCallback(botToken, callback.id, 'User not found.');
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const updates = isGift ? { subscription_status: 'active', subscription_plan: 'monthly', subscription_expires_at: until, updated_at: new Date().toISOString() } : { account_status: 'suspended', suspended_until: until, updated_at: new Date().toISOString() };
  const { error } = await admin.from('users_data').update(updates).eq('user_id', userId);
  if (error) throw error;
  await addNotification(admin, userId, isGift ? 'Pro gift received' : 'Account suspended', isGift ? `An administrator gifted you Pro for ${days} days.` : `Your account is suspended for ${days} days.`);
  return answerCallback(botToken, callback.id, isGift ? `Pro granted for ${days} days.` : `Suspended for ${days} days.`);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { ok: false });
  const settings = config(request);
  const update = request.body || {};
  if (!settings.botToken || !settings.chatId || !settings.url || !settings.serviceKey) return sendJson(response, 503, { ok: false, message: 'Telegram/Supabase server configuration is missing.' });

  try {
    const admin = createClient(settings.url, settings.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const chatId = String(update.callback_query?.message?.chat?.id || update.message?.chat?.id || '');
    if (chatId !== settings.chatId) return sendJson(response, 403, { ok: false });
    if (update.message?.text) {
      const text = String(update.message.text).trim();
      const idCommand = text.match(/^\/id(?:@\w+)?\s+(.+)$/i);
      const msgCommand = text.match(/^\/msg(?:@\w+)?\s+([^\s]+)\s+(.+)$/is);
      if (idCommand) await showUserPanel(admin, settings.botToken, chatId, idCommand[1]);
      else if (msgCommand) {
        const user = await findUser(admin, msgCommand[1]);
        if (user) { await addNotification(admin, user.user_id, 'Message from PulseFit admin', msgCommand[2].trim()); await telegram(settings.botToken, 'sendMessage', { chat_id: chatId, text: 'Message sent.' }); }
        else await telegram(settings.botToken, 'sendMessage', { chat_id: chatId, text: 'User not found.' });
      }
    }
    if (update.callback_query) await handleAdminCallback(admin, settings.botToken, update.callback_query, chatId);
    return sendJson(response, 200, { ok: true });
  } catch (error) {
    if (update.callback_query) await answerCallback(settings.botToken, update.callback_query.id, 'Action failed.');
    return sendJson(response, 500, { ok: false, message: error instanceof Error ? error.message : 'Telegram webhook failed.' });
  }
}
