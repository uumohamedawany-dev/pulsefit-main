import { createClient } from '@supabase/supabase-js';

const BUCKET = 'payment-proofs';
const PLAN_LABELS = { monthly: 'Monthly', yearly: 'Yearly', lifetime: 'Lifetime' };
const PLAN_AMOUNTS = { monthly: 30, yearly: 300, lifetime: 450 };

function json(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function getConfig() {
  return {
    url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

function decodeImage(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('The payment screenshot is invalid.');
  return {
    mimeType: match[1],
    extension: match[1].split('/')[1].replace('jpeg', 'jpg'),
    bytes: Buffer.from(match[2], 'base64'),
  };
}

async function ensureBucket(admin) {
  const { data, error } = await admin.storage.getBucket(BUCKET);
  if (!error && data) {
    const { error: updateError } = await admin.storage.updateBucket(BUCKET, { public: false, fileSizeLimit: '7340032', allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] });
    if (updateError) throw updateError;
    return;
  }
  const { error: createError } = await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: '7340032', allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'] });
  if (createError && !/already exists|duplicate/i.test(createError.message)) throw createError;
}

async function notifyTelegram(config, request, bytes, mimeType, receiptUrl, paymentId) {
  if (!config.botToken || !config.chatId) return false;
  const form = new FormData();
  form.append('chat_id', config.chatId);
  form.append('caption', `New PulseFit subscription request\nUser: ${request.username}\nEmail: ${request.email}\nPlan: ${PLAN_LABELS[request.plan]}\nReceipt: ${receiptUrl}`);
  form.append('reply_markup', JSON.stringify({ inline_keyboard: [[
    { text: '✅ قبول (Approve)', callback_data: `approve_${request.userId}_${paymentId}` },
    { text: '❌ رفض (Decline)', callback_data: `decline_${request.userId}_${paymentId}` },
  ]] }));
  form.append('photo', new Blob([bytes], { type: mimeType }), `payment-proof.${mimeType.split('/')[1]}`);
  const telegramResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/sendPhoto`, { method: 'POST', body: form });
  return telegramResponse.ok;
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { success: false, message: 'Method not allowed.' });

  try {
    const { url, serviceKey, botToken, chatId, anonKey } = getConfig();
    if (!url || !serviceKey) return json(response, 503, { success: false, message: 'Supabase server configuration is missing.' });

    const accessToken = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!accessToken || !anonKey) return json(response, 401, { success: false, message: 'Authenticated Supabase session required.' });
    const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await authClient.auth.getUser(accessToken);
    if (authError || !authData.user) return json(response, 401, { success: false, message: 'Authenticated Supabase session required.' });

    const email = String(request.body?.email || '').trim().toLowerCase();
    const username = String(request.body?.username || email.split('@')[0]).trim();
    const plan = ['monthly', 'yearly', 'lifetime'].includes(request.body?.plan) ? request.body.plan : null;
    const image = decodeImage(request.body?.receiptDataUrl);
    if (!email || !plan || email !== String(authData.user.email || '').toLowerCase()) return json(response, 403, { success: false, message: 'Authenticated user does not match the request.' });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    await ensureBucket(admin);
    const path = `${authData.user.id}/${Date.now()}-${crypto.randomUUID()}.${image.extension}`;
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, image.bytes, { contentType: image.mimeType, upsert: false });
    if (uploadError) throw uploadError;
    const { data: payment, error: paymentError } = await admin.from('payments').insert({ user_id: authData.user.id, email, plan, amount: PLAN_AMOUNTS[plan], receipt_url: path, status: 'pending' }).select('id').single();
    if (paymentError) throw paymentError;
    const telegramSent = await notifyTelegram({ botToken, chatId }, { email, username, plan, userId: authData.user.id }, image.bytes, image.mimeType, `private://${BUCKET}/${path}`, payment.id);

    return json(response, 200, { success: true, paymentId: payment.id, receiptUrl: path, telegramSent, message: telegramSent ? 'Subscription request sent for review.' : 'Subscription request stored for review.' });
  } catch (error) {
    console.error('[subscription request]', error);
    return json(response, 500, { success: false, message: error instanceof Error ? error.message : 'Subscription request failed.' });
  }
}
