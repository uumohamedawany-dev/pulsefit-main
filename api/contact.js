function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { success: false, message: 'Method not allowed.' });

  const token = process.env.CONTACT_DEVELOPER_BOT_TOKEN || '';
  const chatId = String(process.env.TELEGRAM_CHAT_ID || '6317044028');
  const body = request.body || {};
  const message = String(body.message || '').trim();
  if (!message) return sendJson(response, 400, { success: false, message: 'Please write a message before sending.' });
  if (!token || !chatId) return sendJson(response, 503, { success: false, message: 'Contact service is not configured.' });

  const text = [
    '<b>PulseFit Developer Contact</b>',
    '',
    `<b>User ID:</b> ${escapeHtml(body.userId || body.user_id || 'Not provided')}`,
    `<b>Name:</b> ${escapeHtml(body.name || 'PulseFit User')}`,
    `<b>Email:</b> ${escapeHtml(body.email || 'Not provided')}`,
    `<b>Platform:</b> ${escapeHtml(body.platform || 'pulsefit-web')}`,
    `<b>Time:</b> ${escapeHtml(new Date(body.timestamp || Date.now()).toISOString())}`,
    '',
    `<b>Message:</b>\n${escapeHtml(message)}`,
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, parse_mode: 'HTML', text }),
    });
    if (!telegramResponse.ok) throw new Error('Telegram delivery failed.');
    return sendJson(response, 200, { success: true, telegramSent: true, message: 'Your message was sent successfully.' });
  } catch (error) {
    console.error('[contact telegram]', error);
    return sendJson(response, 502, { success: false, message: 'Your message could not be delivered. Please try again.' });
  }
}