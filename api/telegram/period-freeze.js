function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { success: false });
  const token = process.env.PERIOD_FREEZE_BOT_TOKEN || '';
  const chatId = String(process.env.TELEGRAM_CHAT_ID || '6317044028');
  const body = request.body || {};
  const durationDays = Math.min(7, Math.max(1, Number(body.durationDays) || 0));
  if (!token || !chatId) return sendJson(response, 503, { success: false, message: 'Period freeze support is not configured.' });
  if (!body.name || !body.startDate || !durationDays) return sendJson(response, 400, { success: false, message: 'Freeze details are incomplete.' });

  const text = [
    '<b>❄️ PulseFit Period Streak Freeze Request</b>',
    '',
    `<b>User ID:</b> ${escapeHtml(body.userId || 'Not provided')}`,
    `<b>Name:</b> ${escapeHtml(body.name)}`,
    `<b>Age:</b> ${escapeHtml(body.age || 'Not provided')}`,
    `<b>Governorate:</b> ${escapeHtml(body.governorate || 'Not provided')}`,
    `<b>Height:</b> ${escapeHtml(body.height || 'Not provided')} cm`,
    `<b>Weight:</b> ${escapeHtml(body.weight || 'Not provided')} kg`,
    `<b>Freeze start:</b> ${escapeHtml(new Date(body.startDate).toISOString())}`,
    `<b>Duration:</b> ${durationDays} day(s)`,
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, parse_mode: 'HTML', text }) });
    if (!telegramResponse.ok) throw new Error('Telegram delivery failed.');
    return sendJson(response, 200, { success: true, message: 'Freeze request sent to support.' });
  } catch (error) {
    console.error('[period freeze telegram]', error);
    return sendJson(response, 502, { success: false, message: 'Freeze request could not be sent. Please try again.' });
  }
}