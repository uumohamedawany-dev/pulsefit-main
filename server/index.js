import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT || 8090);
const DEFAULT_TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8607034708:AAHHy-9ikOcpZweQJF__OEQnKsRxmjvSZsE';
const BOYS_BOT_TOKEN = process.env.PULSEFIT_BOYS_BOT_TOKEN || '8952414603:AAHsN2Cxd986dmeRsMn8kAwZdFjDPbMHHUw';
const GIRLS_BOT_TOKEN = process.env.PULSEFIT_GIRLS_BOT_TOKEN || '8980012838:AAF7zwms95Xjx3fBB6AZQ-cRdx2qBlJRiyY';
const DEFAULT_TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6317044028';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DEFAULT_SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'pulsefitotp@gmail.com',
  pass: 'pulsefitotp15092026',
  from: 'PulseFit <pulsefitotp@gmail.com>',
};

const users = new Map();
const pendingRegistrations = new Map();
const pendingLogins = new Map();
const healthSnapshots = [];
const contactMessages = [];
const activityEvents = [];
const adminTokens = new Set();
const adminAuditLogs = [];
const broadcastMessages = [];
const scannedMeals = [];
const MASTER_ADMIN_EMAIL = 'uu.mohamed.awany@gmail.com';
const MASTER_ADMIN_PASSWORD = 'uuadmin17092008';
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const subscriptionRequests = new Map();
const friendRequests = new Map();
const userNotifications = new Map();
const workoutCheckIns = new Map();
const exercisePrs = new Map();
const waterLogs = [];
const bodyMeasurements = [];

let cachedTransport = null;

function sanitizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function generatePublicUserId() {
  let publicUserId = '';
  do {
    publicUserId = `#PF-${10000 + Math.floor(Math.random() * 90000)}`;
  } while ([...users.values()].some((user) => user.publicUserId === publicUserId));
  return publicUserId;
}

function normalizeUser(input = {}) {
  const email = sanitizeEmail(input.email);

  return {
    id: input.userId || crypto.randomUUID(),
    publicUserId: input.publicUserId || generatePublicUserId(),
    email,
    username: String(input.username || input.firstName || email.split('@')[0] || 'athlete').trim(),
    firstName: String(input.firstName || '').trim(),
    lastName: String(input.lastName || '').trim(),
    password: String(input.password || ''),
    gender: input.gender === 'female' ? 'female' : 'male',
    weight: Number(input.weight) || 0,
    height: Number(input.height) || 0,
    age: Number(input.age) || 0,
    governorate: String(input.governorate || '').trim() || null,
    streakDays: Number(input.streakDays) || 0,
    points: Number(input.points) || 0,
    badges: Array.isArray(input.badges) ? input.badges.filter((badge) => typeof badge === 'string') : [],
    signupSource: input.signupSource || 'pulsefit-web',
    goal: input.goal || 'maintenance',
    subscriptionPlan: input.subscriptionPlan || null,
    subscriptionStatus: input.subscriptionStatus || 'trial',
    subscriptionExpiresAt: input.subscriptionExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      streakFrozen: Boolean(input.streakFrozen),
      streakFreezeDays: Math.max(0, Number(input.streakFreezeDays) || 0),
      streakFrozenAt: input.streakFrozenAt || null,
    avatar: input.avatar || null,
    profilePicture: input.profilePicture || null,
    deviceInfo: input.deviceInfo || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    emailVerified: false,
  };
}

function redactUser(user) {
  if (!user) {
    return null;
  }

  const { password, deviceInfo, ...safeUser } = user;

  return {
    ...safeUser,
    avatar: user.avatar ?? null,
    profilePicture: user.profilePicture ?? null,
  };
}

function publicFriendProfile(user, status) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
    streakDays: Number(user.streakDays || 0),
    points: Number(user.points || user.streakDays || 0),
    completedWorkouts: Number(user.completedWorkouts || 0),
    steps: Number(user.steps || 0),
    status,
  };
}

function buildToken(user) {
  return `pulsefit-${user.email}-${crypto.randomUUID()}`;
}

function buildAdminToken() {
  const token = `pulsefit-admin-${crypto.randomBytes(32).toString('hex')}`;
  adminTokens.add(token);
  return token;
}

function requireAdmin(req, res, next) {
  const email = sanitizeEmail(req.headers['x-admin-email']);
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');

  if (email !== MASTER_ADMIN_EMAIL || !adminTokens.has(token)) {
    return res.status(403).json({ success: false, message: 'Admin authorization required.' });
  }

  next();
}

function createTransport() {
  const host = process.env.SMTP_HOST || DEFAULT_SMTP_CONFIG.host;
  const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_CONFIG.port);
  const secure = process.env.SMTP_SECURE === 'true' || DEFAULT_SMTP_CONFIG.secure;
  const user = process.env.SMTP_USER || DEFAULT_SMTP_CONFIG.user;
  const pass = process.env.SMTP_PASS || DEFAULT_SMTP_CONFIG.pass;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function buildOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, otp) {
  const transport = cachedTransport || createTransport();
  cachedTransport = transport;

  const from = process.env.SMTP_FROM || DEFAULT_SMTP_CONFIG.from;

  if (!transport) {
    console.log(`\n[OTP DEV MODE] Verification code for ${email}: ${otp}\n`);
    return {
      sent: false,
      mode: 'console',
    };
  }

  const response = await transport.sendMail({
    from,
    to: email,
    subject: 'PulseFit verification code',
    text: `Your PulseFit verification code is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #111827;">
        <h2 style="margin-bottom: 12px;">PulseFit verification</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 18px 0;">${otp}</div>
        <p>This code will expire in 5 minutes.</p>
      </div>
    `,
  });

  return {
    sent: true,
    response,
  };
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractJsonObject(text = '') {
  const cleaned = String(text || '')
    .replace(/```json/gim, '')
    .replace(/```/g, '')
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function analyzeFoodImage(imageBase64, mimeType = 'image/jpeg') {
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  const normalizedBase64 = String(imageBase64 || '').replace(/^data:image\/[a-zA-Z-]+;base64,/, '').trim();

  if (!normalizedBase64) {
    throw new Error('No meal image data was provided.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: 'You are a nutrition expert. Analyze this meal image and return only valid JSON with exactly these keys: food_name, calories, protein, carbs, fats. food_name must be in Arabic. Use integers for all numeric values. If uncertain, estimate conservatively and keep the response valid JSON only.',
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: normalizedBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Gemini API request failed: ${payload}`);
  }

  const payload = await response.json();
  const responseText = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';

  if (!responseText) {
    throw new Error('Gemini returned an empty analysis response.');
  }

  const parsed = extractJsonObject(responseText);

  if (!parsed) {
    throw new Error('Gemini returned a malformed food analysis response.');
  }

  return {
    food_name: String(parsed.food_name || parsed.foodName || 'وجبة').trim() || 'وجبة',
    calories: Number(parsed.calories ?? 0) || 0,
    protein: Number(parsed.protein ?? 0) || 0,
    carbs: Number(parsed.carbs ?? 0) || 0,
    fats: Number(parsed.fats ?? parsed.fat ?? 0) || 0,
  };
}

async function notifyTelegramRegistration(user) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log(`[Telegram] Registration alert skipped for ${user.email}; env vars not configured.`);
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `PulseFit new user registered: ${user.email} (${user.username})`,
      }),
    });

    const payload = await response.json();
    console.log('[Telegram] notification response:', payload);
  } catch (error) {
    console.error('[Telegram] notification failed:', error);
  }
}

async function relayDeveloperContact(payload) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_TELEGRAM_CHAT_ID;

  const message = String(payload.message || '').trim();
  const fromName = String(payload.name || 'PulseFit User').trim() || 'PulseFit User';
  const fromEmail = sanitizeEmail(payload.email || '');
  const platform = String(payload.platform || 'pulsefit-web').trim() || 'pulsefit-web';
  const timestamp = payload.createdAt || new Date().toISOString();

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'HTML',
        text: `
          <b>PulseFit Developer Contact</b>\n\n
          <b>Name:</b> ${escapeHtml(fromName)}\n
          <b>Email:</b> ${escapeHtml(fromEmail || 'Not provided')}\n
          <b>Platform:</b> ${escapeHtml(platform)}\n
          <b>Time:</b> ${escapeHtml(new Date(timestamp).toLocaleString())}\n\n
          <b>Message:</b>\n${escapeHtml(message)}
        `.trim(),
      }),
    });

    const result = await response.json();
    console.log('[Telegram] contact relay response:', result);
    return response.ok;
  } catch (error) {
    console.error('[Telegram] contact relay failed:', error);
    return false;
  }
}

async function relaySubscriptionReceipt(request) {
  const receiptMatch = String(request.receiptDataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!receiptMatch) {
    return false;
  }

  const form = new FormData();
  form.append('chat_id', DEFAULT_TELEGRAM_CHAT_ID);
  form.append('caption', `🔔 طلب اشتراك ${request.planLabel} جديد للمراجعة\n\n👤 Username: ${request.username}\n📧 Email: ${request.email}\n💳 الخطة: ${request.planLabel}`);
  form.append('photo', new Blob([Buffer.from(receiptMatch[2], 'base64')], { type: receiptMatch[1] }), 'transfer-receipt.jpg');

  const response = await fetch(`https://api.telegram.org/bot${DEFAULT_TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form });
  return response.ok;
}

function subscriptionPlanLabel(plan) {
  return plan === 'monthly' ? 'الشهرية' : plan === 'yearly' ? 'السنوية' : 'الأبدية';
}

function applySubscription(user, plan) {
  user.subscriptionPlan = plan;
  user.subscriptionStatus = 'active';
  user.subscriptionExpiresAt = plan === 'lifetime'
    ? null
    : new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
  user.updatedAt = new Date().toISOString();
}

function addUserNotification(email, notification) {
  const list = userNotifications.get(email) || [];
  list.unshift({
    id: crypto.randomUUID(),
    title: notification.title,
    message: notification.message,
    type: notification.type || 'system',
    createdAt: new Date().toISOString(),
    read: false,
  });
  userNotifications.set(email, list.slice(0, 100));
}

async function sendTelegramReport(botToken, text) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: DEFAULT_TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[Hourly report] Telegram returned HTTP ${response.status}`);
    }

    return response.ok;
  } catch (error) {
    console.error('[Hourly report] Telegram dispatch failed:', error instanceof Error ? error.message : error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function hoursSince(timestamp) {
  const parsed = Date.parse(timestamp || '');
  return Number.isFinite(parsed) ? Math.max(0, (Date.now() - parsed) / (60 * 60 * 1000)) : null;
}

function buildHourlyReport(gender) {
  const since = Date.now() - 60 * 60 * 1000;
  const label = gender === 'female' ? 'البنات' : 'الشباب';
  const group = [...users.values()].filter((user) => user.gender === gender);
  const newUsers = group.filter((user) => Date.parse(user.createdAt) >= since);
  const groupEmails = new Set(group.map((user) => user.email));
  const recentActivities = activityEvents.filter((event) => groupEmails.has(event.email) && Date.parse(event.timestamp || event.receivedAt) >= since);
  const recentHealth = healthSnapshots.filter((snapshot) => groupEmails.has(sanitizeEmail(snapshot.email)) && Date.parse(snapshot.timestamp) >= since);
  const recentSubscriptions = [...subscriptionRequests.values()].filter((request) => groupEmails.has(request.email) && Date.parse(request.createdAt) >= since);
  const workouts = recentActivities.filter((event) => event.type === 'workout').length;
  const meals = recentActivities.filter((event) => event.type === 'meal').length;
  const frozenUsers = gender === 'female' ? group.filter((user) => user.streakFrozen) : [];

  const lines = [
    `📊 تقرير ${label} الساعي - حالة النشاط`,
    `🕐 ${new Date().toLocaleString('ar-EG')}`,
    '',
    `👥 إجمالي المستخدمين: ${group.length}`,
    `🆕 تسجيلات جديدة آخر ساعة: ${newUsers.length}`,
    `🏋️ تدريبات مسجلة: ${workouts}`,
    `🍽️ وجبات مسجلة: ${meals}`,
    `💧 تحديثات الصحة: ${recentHealth.length}`,
    `💳 طلبات اشتراك جديدة: ${recentSubscriptions.length}`,
  ];

  if (newUsers.length > 0) {
    lines.push('', '🆕 المستخدمون الجدد:');
    newUsers.forEach((user) => lines.push(`• ${user.username} | ${user.email}`));
  }

  if (recentActivities.length > 0) {
    lines.push('', '⚡ نشاط آخر ساعة:');
    recentActivities.slice(-30).forEach((event) => lines.push(`• ${event.email} | ${event.type}${event.amount ? ` | ${event.amount}` : ''}`));
  }

  if (gender === 'female') {
    lines.push('', `🧊 إجمالي البنات اللي الاستريك بتاعهم متجمد: ${frozenUsers.length}`);
    if (frozenUsers.length > 0) {
      lines.push('📌 تفاصيل التجميد:');
      frozenUsers.forEach((user) => {
        const elapsed = hoursSince(user.streakFrozenAt);
        const duration = Math.max(0, Number(user.streakFreezeDays) || 0);
        const remaining = elapsed === null ? duration : Math.max(0, duration - elapsed / 24);
        lines.push(`• ${user.publicUserId} | ${user.username} | ${user.email} | بدأ من ${user.streakFrozenAt || 'وقت غير معروف'} | مرّ ${elapsed === null ? 'غير معروف' : `${elapsed.toFixed(1)} ساعة`} | باقي ${remaining.toFixed(1)} يوم`);
      });
    }
  }

  return lines.join('\n').slice(0, 3900);
}

let hourlyReportRunning = false;

async function dispatchHourlyReports() {
  if (hourlyReportRunning) {
    console.warn('[Hourly report] Previous run is still active; skipping this cycle.');
    return { boysSent: false, girlsSent: false, skipped: true };
  }

  hourlyReportRunning = true;
  try {
    const [boysSent, girlsSent] = await Promise.all([
      sendTelegramReport(BOYS_BOT_TOKEN, buildHourlyReport('male')),
      sendTelegramReport(GIRLS_BOT_TOKEN, buildHourlyReport('female')),
    ]);
    return { boysSent, girlsSent, skipped: false };
  } finally {
    hourlyReportRunning = false;
  }
}

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const handleContactSubmission = async (req, res) => {
  try {
    const body = req.body || {};
    const message = String(body.message || '').trim();

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const payload = {
      name: String(body.name || '').trim(),
      email: sanitizeEmail(body.email || ''),
      platform: String(body.platform || 'pulsefit-web').trim(),
      message,
      createdAt: new Date().toISOString(),
    };

    contactMessages.push(payload);

    const telegramSent = await relayDeveloperContact(payload);

    return res.json({
      success: true,
      message: 'Your message was delivered to the developer team.',
      telegramSent,
      storedCount: contactMessages.length,
    });
  } catch (error) {
    console.error('[contact]', error);
    return res.status(500).json({ success: false, message: 'Contact submission failed.' });
  }
};

app.post('/api/contact', handleContactSubmission);
app.post('/api/contact/developer', handleContactSubmission);

app.post('/api/subscriptions/request', async (req, res) => {
  try {
    const email = sanitizeEmail(req.body?.email);
    const plan = ['monthly', 'yearly', 'lifetime'].includes(req.body?.plan) ? req.body.plan : null;
    const receiptDataUrl = String(req.body?.receiptDataUrl || '');
    const user = users.get(email);

    if (!user || !plan || !receiptDataUrl) {
      return res.status(400).json({ success: false, message: 'لازم تختار خطة وترفع صورة التحويل.' });
    }

    const request = {
      id: crypto.randomUUID(),
      email,
      username: String(req.body?.username || user.username || email.split('@')[0]),
      plan,
      planLabel: subscriptionPlanLabel(plan),
      receiptDataUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    subscriptionRequests.set(request.id, request);
    let telegramSent = false;
    try { telegramSent = await relaySubscriptionReceipt(request); } catch (error) { console.error('[subscription telegram]', error); }
    return res.json({ success: true, message: telegramSent ? 'تم استلام الطلب وبعتناه للمراجعة على تيليجرام.' : 'تم استلام طلبك للمراجعة.', telegramSent });
  } catch (error) {
    console.error('[subscription request]', error);
    return res.status(500).json({ success: false, message: 'حصل خطأ في إرسال طلب الاشتراك.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const body = req.body || {};
    const email = sanitizeEmail(body.email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    if (users.has(email)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const isPending = pendingRegistrations.has(email) || pendingLogins.has(email);

    if (isPending) {
      return res.status(409).json({ success: false, message: 'تم إرسال كود التحقق بالفعل لهذا البريد الإلكتروني. لو سمحت، اتأكد من الرسالة أو اطلب كود جديد بعد قليل.' });
    }

    const normalizedUser = normalizeUser({
      ...body,
      email,
      password: body.password || '',
    });

    const otp = buildOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    pendingRegistrations.set(email, {
      otp,
      expiresAt,
      user: normalizedUser,
    });

    await sendOtpEmail(email, otp);

    return res.json({
      success: true,
      requiresOtp: true,
      message: 'تم إرسال كود التحقق على بريدك الإلكتروني.',
      email,
      userId: normalizedUser.id,
      user: redactUser(normalizedUser),
    });
  } catch (error) {
    console.error('[register]', error);
    return res.status(500).json({ success: false, message: 'فشل إنشاء الحساب.' });
  }
});

app.post('/api/auth/master-admin', async (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  if (email !== MASTER_ADMIN_EMAIL || password !== MASTER_ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ success: false, message: 'Supabase administrator configuration is missing.' });
  }

  try {
    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    };
    const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, { headers });
    const listPayload = await listResponse.json();

    if (!listResponse.ok) {
      throw new Error(listPayload?.msg || listPayload?.message || 'Unable to inspect the Supabase administrator account.');
    }

    const existingUser = (listPayload?.users || []).find((user) => sanitizeEmail(user.email) === MASTER_ADMIN_EMAIL);
    const userPayload = {
      email: MASTER_ADMIN_EMAIL,
      password: MASTER_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        username: 'yahiaawany',
        first_name: 'Yahia',
        last_name: 'Awany',
        governorate: 'Alexandria',
        age: 18,
        height: 177,
        weight: 63,
        gender: 'male',
        goal: 'maintenance',
      },
    };

    if (!existingUser) {
      const createResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(userPayload),
      });
      const createPayload = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(createPayload?.msg || createPayload?.message || 'Unable to create the Supabase administrator account.');
      }

      return res.json({ success: true, created: true, confirmed: true, userId: createPayload.id });
    }

    const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(existingUser.id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userPayload),
    });
    const updatePayload = await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(updatePayload?.msg || updatePayload?.message || 'Unable to confirm the Supabase administrator account.');
    }

    return res.json({ success: true, created: false, confirmed: true, userId: updatePayload.id || existingUser.id });
  } catch (error) {
    console.error('[master-admin supabase]', error);
    return res.status(502).json({ success: false, message: error instanceof Error ? error.message : 'Supabase administrator setup failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const body = req.body || {};
    const email = sanitizeEmail(body.email);
    const password = String(body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (email === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
      const adminUser = normalizeUser({
        userId: 'pulsefit-master-admin',
        email: MASTER_ADMIN_EMAIL,
        username: 'yahiaawany',
        firstName: 'Yahia',
        lastName: 'Awany',
        gender: 'male',
        governorate: 'Alexandria',
        age: 18,
        height: 177,
        weight: 63,
        goal: 'maintenance',
        subscriptionPlan: 'lifetime',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: null,
      });
      adminUser.emailVerified = true;
      return res.json({ success: true, message: 'تم تسجيل دخول المدير الرئيسي بنجاح.', token: buildAdminToken(), user: redactUser(adminUser) });
    }

    const existingUser = users.get(email);

    if (!existingUser) {
      return res.status(401).json({ success: false, message: 'No account was found for this email.' });
    }

    if (existingUser.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const otp = buildOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    pendingLogins.set(email, {
      otp,
      expiresAt,
      user: existingUser,
    });

    await sendOtpEmail(email, otp);

    return res.json({
      success: true,
      requiresOtp: true,
      message: 'تم إرسال كود التحقق على بريدك الإلكتروني.',
      email,
      userId: existingUser.id,
      user: redactUser(existingUser),
    });
  } catch (error) {
    console.error('[login]', error);
    return res.status(500).json({ success: false, message: 'فشل تسجيل الدخول.' });
  }
});

app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const body = req.body || {};
    const email = sanitizeEmail(body.email);
    const mode = body.mode === 'login' ? 'login' : 'signup';

    if (!email) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب.' });
    }

    if (mode === 'signup') {
      const existingRegistration = pendingRegistrations.get(email);

      if (!existingRegistration) {
        return res.status(404).json({ success: false, message: 'ما فيش طلب تحقق نشيط لهذا البريد الإلكتروني.' });
      }

      const otp = buildOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      existingRegistration.otp = otp;
      existingRegistration.expiresAt = expiresAt;

      await sendOtpEmail(email, otp);

      return res.json({
        success: true,
        requiresOtp: true,
        message: 'تم إرسال كود تفعيل جديد بنجاح.',
        email,
        userId: existingRegistration.user.id,
        user: redactUser(existingRegistration.user),
      });
    }

    const existingUser = users.get(email);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'مافيش حساب مسجل بهذا البريد الإلكتروني.' });
    }

    const otp = buildOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    pendingLogins.set(email, {
      otp,
      expiresAt,
      user: existingUser,
    });

    await sendOtpEmail(email, otp);

    return res.json({
      success: true,
      requiresOtp: true,
      message: 'تم إرسال كود تفعيل جديد بنجاح.',
      email,
      userId: existingUser.id,
      user: redactUser(existingUser),
    });
  } catch (error) {
    console.error('[resend-otp]', error);
    return res.status(500).json({ success: false, message: 'فشل في إرسال كود التحقق الجديد.' });
  }
});

app.post('/api/scan-food', async (req, res) => {
  try {
    const body = req.body || {};
    const imageBase64 = String(body.imageBase64 || '').trim();
    const mimeType = String(body.mimeType || 'image/jpeg').trim();

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'برجاء اختيار صورة للوجبة أولاً.',
      });
    }

    const result = await analyzeFoodImage(imageBase64, mimeType);
    scannedMeals.push({ ...result, timestamp: new Date().toISOString() });

    return res.json({
      success: true,
      message: 'تم تحليل الوجبة بنجاح!',
      data: result,
    });
  } catch (error) {
    console.error('[scan-food]', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'فشل في تحليل الوجبة.',
    });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const body = req.body || {};
    const email = sanitizeEmail(body.email);
    const otp = String(body.otp || '').trim();
    const providedUserId = body.userId;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'برجاء إدخال البريد الإلكتروني وكود التحقق.' });
    }

    const registrationEntry = pendingRegistrations.get(email);
    const loginEntry = pendingLogins.get(email);
    const pendingEntry = registrationEntry || loginEntry;

    if (!pendingEntry) {
      return res.status(404).json({ success: false, message: 'ما فيش طلب تحقق نشيط لهذا البريد الإلكتروني.' });
    }

    if (Date.now() > pendingEntry.expiresAt) {
      pendingRegistrations.delete(email);
      pendingLogins.delete(email);
      return res.status(410).json({ success: false, message: 'انتهت صلاحية كود التحقق، اطلب كود جديد.' });
    }

    if (pendingEntry.otp !== otp) {
      return res.status(400).json({ success: false, message: 'كود التحقق غير صحيح، حاول تاني.' });
    }

    if (providedUserId && pendingEntry.user.id !== providedUserId) {
      return res.status(400).json({ success: false, message: 'بيانات التحقق غير متطابقة.' });
    }

    const user = pendingEntry.user;
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();

    if (registrationEntry) {
      users.set(email, user);
      pendingRegistrations.delete(email);
      await notifyTelegramRegistration(user);
    }

    if (loginEntry) {
      users.set(email, user);
      pendingLogins.delete(email);
    }

    const token = buildToken(user);

    return res.json({
      success: true,
      message: registrationEntry ? 'تم تأكيد الحساب بنجاح.' : 'تم تأكيد تسجيل الدخول بنجاح.',
      token,
      user: redactUser(user),
    });
  } catch (error) {
    console.error('[verify-otp]', error);
    return res.status(500).json({ success: false, message: 'فشل في التحقق من الكود.' });
  }
});

app.put('/api/auth/profile', (req, res) => {
  try {
    const body = req.body || {};
    const email = sanitizeEmail(body.email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const existingUser = users.get(email);

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatedUser = {
      ...existingUser,
      username: String(body.username || existingUser.username || email.split('@')[0]).trim(),
      firstName: String(body.firstName || existingUser.firstName || '').trim(),
      lastName: String(body.lastName || existingUser.lastName || '').trim(),
      gender: body.gender === 'female' ? 'female' : body.gender === 'male' ? 'male' : existingUser.gender,
      weight: Number(body.weight) || existingUser.weight || 0,
      height: Number(body.height) || existingUser.height || 0,
      age: Number(body.age) || existingUser.age || 0,
      governorate: String(body.governorate || existingUser.governorate || '').trim() || null,
      streakDays: Number(body.streakDays) || existingUser.streakDays || 0,
      points: Number(body.points) >= 0 ? Number(body.points) : existingUser.points || 0,
      badges: Array.isArray(body.badges) ? body.badges.filter((badge) => typeof badge === 'string') : existingUser.badges || [],
      goal: body.goal || existingUser.goal || 'maintenance',
      avatar: body.avatar ?? existingUser.avatar ?? null,
      profilePicture: body.profilePicture ?? existingUser.profilePicture ?? null,
      updatedAt: new Date().toISOString(),
    };

    users.set(email, updatedUser);

    return res.json({
      success: true,
      message: 'Profile updated.',
      user: redactUser(updatedUser),
    });
  } catch (error) {
    console.error('[profile]', error);
    return res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
});

app.get('/api/auth/profile', (req, res) => {
  const user = users.get(sanitizeEmail(req.query.email));
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json(redactUser(user));
});

app.post('/api/sync/health', (req, res) => {
  const snapshot = req.body || {};

  healthSnapshots.push({
    ...snapshot,
    timestamp: snapshot.timestamp || new Date().toISOString(),
  });

  const email = sanitizeEmail(snapshot.email);
  const user = users.get(email);
  if (user && user.gender === 'female') {
    user.streakFrozen = Boolean(snapshot.streakFrozen);
    user.streakFreezeDays = Math.max(0, Number(snapshot.streakFreezeDays) || 0);
    user.streakFrozenAt = snapshot.streakFrozen ? snapshot.streakFrozenAt || user.streakFrozenAt || new Date().toISOString() : null;
    user.updatedAt = new Date().toISOString();
  }

  return res.json({
    success: true,
    message: 'Health snapshot synced.',
    storedCount: healthSnapshots.length,
  });
});

app.post('/api/sync/activity', (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const activities = Array.isArray(req.body?.activities) ? req.body.activities : [];

  if (!email || !users.has(email)) {
    return res.status(400).json({ success: false, message: 'User is required for activity sync.' });
  }

  const knownIds = new Set(activityEvents.filter((event) => event.email === email).map((event) => event.id));
  const newEvents = activities
    .filter((event) => event?.id && !knownIds.has(event.id))
    .map((event) => ({ ...event, email, receivedAt: new Date().toISOString() }));

  activityEvents.push(...newEvents);
  waterLogs.push(...newEvents.filter((event) => event.type === 'water').map((event) => ({
    id: event.id,
    email,
    amountMl: Number(event.amount) || 0,
    dayKey: String(event.timestamp || '').slice(0, 10),
    createdAt: event.timestamp || new Date().toISOString(),
  })));
  return res.json({ success: true, message: 'Activity queue synced.', storedCount: newEvents.length });
});

app.post('/api/workouts/check-in', (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const note = String(req.body?.note || '').trim();
  const user = users.get(email);

  if (!user || !note || note.length > 160 || note.includes('\n')) {
    return res.status(400).json({ success: false, message: 'اكتب ملاحظة تمرين قصيرة في سطر واحد.' });
  }

  const history = workoutCheckIns.get(email) || [];
  const latest = history[0];
  const elapsed = latest ? Date.now() - Date.parse(latest.createdAt) : Number.POSITIVE_INFINITY;
  if (elapsed < 24 * 60 * 60 * 1000) {
    const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - elapsed) / (60 * 60 * 1000));
    return res.status(409).json({ success: false, message: `سجلت تمرينة قبل كده. استنى ${hoursLeft} ساعة قبل الـ check-in الجاي.` });
  }

  const entry = { id: crypto.randomUUID(), email, note, createdAt: new Date().toISOString() };
  workoutCheckIns.set(email, [entry, ...history].slice(0, 365));
  activityEvents.push({ id: entry.id, email, type: 'workout', note, timestamp: entry.createdAt, receivedAt: entry.createdAt });
  return res.json({ success: true, message: 'عاش يا وحش! اتسجلت تمرينة النهارده وزودت الستريك.', data: entry });
});

app.post('/api/exercises/pr', (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const exerciseName = String(req.body?.exerciseName || '').trim();
  const value = String(req.body?.value || '').trim();
  if (!users.has(email) || !exerciseName || !value || exerciseName.length > 160 || value.length > 80) {
    return res.status(400).json({ success: false, message: 'اكتب قيمة PR صحيحة.' });
  }

  const records = exercisePrs.get(email) || {};
  records[exerciseName] = { value, updatedAt: new Date().toISOString() };
  exercisePrs.set(email, records);
  return res.json({ success: true, message: 'تم حفظ الـ PR بتاعك.' });
});

app.post('/api/body/measurements', (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  if (!users.has(email)) return res.status(400).json({ success: false, message: 'User is required.' });
  const measurement = {
    id: crypto.randomUUID(),
    email,
    date: String(req.body?.date || new Date().toISOString()),
    weight: Number(req.body?.weight) || 0,
    waist: Number(req.body?.waist) || null,
    chest: Number(req.body?.chest) || null,
    arms: Number(req.body?.arms) || null,
    bodyFatPercentage: Number(req.body?.bodyFatPercentage) || 0,
    muscleMass: Number(req.body?.muscleMass) || null,
    photoDataUrl: String(req.body?.photoDataUrl || '').slice(0, 8_000_000) || null,
    notes: String(req.body?.notes || '').slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  bodyMeasurements.push(measurement);
  return res.json({ success: true, message: 'تم حفظ القياسات وصورة التقدم.' });
});

app.get('/api/friends/search', (req, res) => {
  const ownerEmail = sanitizeEmail(req.query.email);
  const query = String(req.query.q || '').trim().toLowerCase();

  if (!ownerEmail || query.length < 2) {
    return res.json([]);
  }

  const results = [...users.values()]
    .filter((user) => user.email !== ownerEmail && (user.email.includes(query) || user.username.toLowerCase().includes(query)))
    .slice(0, 20)
    .map((user) => publicFriendProfile(user));

  return res.json(results);
});

app.get('/api/friends', (req, res) => {
  const ownerEmail = sanitizeEmail(req.query.email);
  const incoming = [];
  const outgoing = [];
  const friends = [];

  for (const request of friendRequests.values()) {
    if (request.status === 'accepted' && (request.fromEmail === ownerEmail || request.toEmail === ownerEmail)) {
      const friendEmail = request.fromEmail === ownerEmail ? request.toEmail : request.fromEmail;
      const friend = users.get(friendEmail);
      if (friend) friends.push({ ...publicFriendProfile(friend, 'friend'), requestId: request.id });
    } else if (request.status === 'pending' && request.toEmail === ownerEmail) {
      const sender = users.get(request.fromEmail);
      if (sender) incoming.push({ ...publicFriendProfile(sender, 'incoming'), requestId: request.id });
    } else if (request.status === 'pending' && request.fromEmail === ownerEmail) {
      const recipient = users.get(request.toEmail);
      if (recipient) outgoing.push({ ...publicFriendProfile(recipient, 'pending'), requestId: request.id });
    }
  }

  return res.json({ friends, incoming, outgoing });
});

app.post('/api/friends/request', (req, res) => {
  const fromEmail = sanitizeEmail(req.body?.fromEmail);
  const toEmail = sanitizeEmail(req.body?.toEmail);

  if (!fromEmail || !toEmail || fromEmail === toEmail || !users.has(fromEmail) || !users.has(toEmail)) {
    return res.status(400).json({ success: false, message: 'لازم تختار مستخدم مسجل مختلف عنك.' });
  }

  const duplicate = [...friendRequests.values()].find((request) => (
    request.status === 'pending' && ((request.fromEmail === fromEmail && request.toEmail === toEmail) || (request.fromEmail === toEmail && request.toEmail === fromEmail))
  ));

  if (duplicate) {
    return res.status(409).json({ success: false, message: 'طلب الصداقة موجود بالفعل.' });
  }

  const request = { id: crypto.randomUUID(), fromEmail, toEmail, status: 'pending', createdAt: new Date().toISOString() };
  friendRequests.set(request.id, request);
  return res.json({ success: true, message: 'تم إرسال طلب الصداقة.' });
});

app.post('/api/friends/respond', (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const request = friendRequests.get(String(req.body?.requestId || ''));

  if (!request || request.toEmail !== email || request.status !== 'pending') {
    return res.status(404).json({ success: false, message: 'طلب الصداقة غير موجود.' });
  }

  request.status = req.body?.accept ? 'accepted' : 'declined';
  friendRequests.set(request.id, request);
  return res.json({ success: true, message: request.status === 'accepted' ? 'بقيتوا أصحاب!' : 'تم رفض الطلب.' });
});

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const records = [...users.values()].map((entry) => ({
    ...redactUser(entry),
    publicUserId: entry.publicUserId,
    status: entry.status || 'active',
    isActive: entry.isActive !== false,
    isSuspended: Boolean(entry.isSuspended),
    isBanned: Boolean(entry.isBanned),
    activityCount: activityEvents.filter((event) => event.email === entry.email).length,
  }));
  return res.json(records);
});

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const maleCount = [...users.values()].filter((user) => user.gender === 'male').length;
  const femaleCount = [...users.values()].filter((user) => user.gender === 'female').length;
  const genderAnalytics = {
    male: { count: maleCount, percentage: users.size ? Number(((maleCount / users.size) * 100).toFixed(2)) : 0 },
    female: { count: femaleCount, percentage: users.size ? Number(((femaleCount / users.size) * 100).toFixed(2)) : 0 },
  };

  const growthStart = new Date();
  growthStart.setHours(0, 0, 0, 0);
  growthStart.setDate(growthStart.getDate() - 13);
  const userGrowthAnalytics = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(growthStart);
    day.setDate(growthStart.getDate() + index);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const newUsers = [...users.values()].filter((user) => {
      const created = Date.parse(user.createdAt || '');
      return created >= day.getTime() && created < nextDay.getTime();
    }).length;
    const cumulativeUsers = [...users.values()].filter((user) => Date.parse(user.createdAt || '') < nextDay.getTime()).length;
    return {
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      newUsers,
      cumulativeUsers,
    };
  });

  const governorateCounts = new Map();
  for (const user of users.values()) {
    const governorate = user.governorate || 'غير محددة';
    governorateCounts.set(governorate, (governorateCounts.get(governorate) || 0) + 1);
  }
  const governorateAnalytics = [...governorateCounts.entries()]
    .map(([governorate, count]) => ({ governorate, count, percentage: users.size ? Number(((count / users.size) * 100).toFixed(2)) : 0 }))
    .sort((a, b) => b.count - a.count || a.governorate.localeCompare(b.governorate, 'ar'));

  const activityLogs = [
    ...adminAuditLogs,
    ...broadcastMessages.map((entry) => ({ type: 'broadcast', message: entry.message, timestamp: entry.timestamp })),
    ...contactMessages.map((entry) => ({ type: 'telegram-contact', message: entry.message, userEmail: entry.email, timestamp: entry.createdAt })),
    ...scannedMeals.slice(-20).map((entry) => ({ type: 'ai-meal-scan', message: entry.food_name, timestamp: entry.timestamp })),
  ].sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')));

  return res.json({
    totalUsers: users.size,
    activeUsers: [...users.values()].filter((entry) => entry.isActive !== false && !entry.isBanned).length,
    activeSessions: users.size,
    scannedMeals: scannedMeals.length,
    feedbackLogs: contactMessages.length,
    telegramMessages: contactMessages.length,
    avgStreakDays: users.size ? Math.round([...users.values()].reduce((sum, entry) => sum + Number(entry.streakDays || 0), 0) / users.size) : 0,
    uptime: `${Math.round(process.uptime())} seconds`,
    lastSync: healthSnapshots.at(-1)?.timestamp || null,
    activityLogs,
    governorateAnalytics,
    genderAnalytics,
    userGrowthAnalytics,
  });
});

app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  const user = [...users.values()].find((entry) => entry.id === req.params.id || entry.email === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const body = req.body || {};
  user.username = String(body.username || user.username).trim();
  user.email = sanitizeEmail(body.email || user.email);
  user.streakDays = Number(body.streakDays ?? user.streakDays) || 0;
  user.status = body.status || user.status || 'active';
  user.isActive = body.isActive ?? user.status === 'active';
  user.isSuspended = user.status === 'suspended';
  user.isBanned = user.status === 'banned';
  user.updatedAt = new Date().toISOString();
  users.set(user.email, user);
  adminAuditLogs.push({ type: 'admin-user-update', message: `Updated ${user.email}`, timestamp: user.updatedAt });
  return res.json(redactUser(user));
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const user = [...users.values()].find((entry) => entry.id === req.params.id || entry.email === req.params.id);
  if (!user || user.email === MASTER_ADMIN_EMAIL) return res.status(400).json({ success: false, message: 'This user cannot be deleted.' });
  users.delete(user.email);
  adminAuditLogs.push({ type: 'admin-user-delete', message: `Deleted ${user.email}`, timestamp: new Date().toISOString() });
  return res.json({ success: true, message: 'User deleted.' });
});

app.post('/api/admin/broadcast', requireAdmin, (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ success: false, message: 'اكتب رسالة الإعلان الأول.' });
  const entry = { message, timestamp: new Date().toISOString(), delivered: [...users.values()].filter((user) => user.isActive !== false && !user.isBanned).length };
  broadcastMessages.push(entry);
  for (const user of users.values()) {
    if (user.isActive !== false && !user.isBanned) {
      addUserNotification(user.email, { title: 'إعلان جديد من PulseFit', message, type: 'broadcast' });
    }
  }
  adminAuditLogs.push({ type: 'admin-broadcast', message, timestamp: entry.timestamp });
  return res.json({ success: true, message: 'تم حفظ الإعلان وإرساله للمستخدمين النشطين.', delivered: entry.delivered });
});

app.get('/api/admin/subscriptions', requireAdmin, (_req, res) => {
  const safeRequests = [...subscriptionRequests.values()].map(({ receiptDataUrl, ...request }) => ({ ...request, receiptDataUrl }));
  return res.json(safeRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.post('/api/admin/subscriptions/:id/:action', requireAdmin, (req, res) => {
  const request = subscriptionRequests.get(req.params.id);
  const action = req.params.action;
  if (!request || !['approve', 'decline'].includes(action)) {
    return res.status(404).json({ success: false, message: 'طلب الاشتراك غير موجود.' });
  }

  const user = users.get(request.email);
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });
  request.status = action === 'approve' ? 'approved' : 'declined';
  if (action === 'approve') applySubscription(user, request.plan);
  addUserNotification(user.email, {
    title: action === 'approve' ? 'تم تفعيل اشتراكك 🎉' : 'تمت مراجعة طلب الاشتراك',
    message: action === 'approve' ? 'تمت الموافقة على طلبك وبقى حسابك Pro. استمتع بكل المميزات يا وحش!' : 'طلب الاشتراك اترفض. راجع صورة التحويل أو كلم الدعم لو محتاج مساعدة.',
    type: 'subscription',
  });
  adminAuditLogs.push({ type: `subscription-${action}`, message: `${action} ${request.email} (${request.plan})`, timestamp: new Date().toISOString() });
  return res.json({ success: true, message: action === 'approve' ? 'تم قبول الاشتراك وتفعيل Pro.' : 'تم رفض طلب الاشتراك.' });
});

app.post('/api/admin/subscriptions/grant', requireAdmin, (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const plan = ['monthly', 'yearly', 'lifetime'].includes(req.body?.plan) ? req.body.plan : null;
  const user = users.get(email);
  if (!user || !plan) return res.status(400).json({ success: false, message: 'اكتب بريد صحيح واختار خطة.' });
  applySubscription(user, plan);
  addUserNotification(user.email, { title: 'تم تفعيل Pro 🎉', message: 'الأدمن فعّل لك اشتراك Pro يدويًا. استمتع بكل المميزات!', type: 'subscription' });
  adminAuditLogs.push({ type: 'subscription-manual-grant', message: `Granted ${plan} to ${email}`, timestamp: new Date().toISOString() });
  return res.json({ success: true, message: 'تم تفعيل Pro للمستخدم.' });
});

app.post('/api/admin/message', requireAdmin, (req, res) => {
  const publicUserId = String(req.body?.publicUserId || '').trim();
  const message = String(req.body?.message || '').trim();
  const user = [...users.values()].find((entry) => entry.publicUserId === publicUserId);

  if (!user || !message) {
    return res.status(400).json({ success: false, message: 'اكتب User ID صحيح ورسالة الأول.' });
  }

  addUserNotification(user.email, { title: 'رسالة من فريق PulseFit', message, type: 'direct' });
  adminAuditLogs.push({ type: 'admin-direct-message', message: `Message sent to ${publicUserId}`, timestamp: new Date().toISOString() });
  return res.json({ success: true, message: 'تم إرسال الرسالة للمستخدم.' });
});

app.get('/api/notifications', (req, res) => {
  const email = sanitizeEmail(req.query.email);
  return res.json(userNotifications.get(email) || []);
});

app.post('/api/notifications/read', (req, res) => {
  const email = sanitizeEmail(req.body?.email);
  const id = String(req.body?.id || '');
  const notifications = userNotifications.get(email) || [];
  const notification = notifications.find((entry) => entry.id === id);
  if (notification) notification.read = true;
  return res.json({ success: true });
});

app.post('/api/admin/reports/hourly', requireAdmin, async (_req, res) => {
  const result = await dispatchHourlyReports();
  return res.json({ success: result.boysSent || result.girlsSent, ...result });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Unknown endpoint: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`PulseFit server running on http://localhost:${PORT}`);
  console.log('OTP email delivery uses SMTP when configured, otherwise it logs codes to the console.');
});

const hourlyReportTimer = setInterval(() => {
  void dispatchHourlyReports().catch((error) => {
    console.error('[Hourly report] Unexpected scheduler failure:', error);
  });
}, 60 * 60 * 1000);

hourlyReportTimer.unref?.();
