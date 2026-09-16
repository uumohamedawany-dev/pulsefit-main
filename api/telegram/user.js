function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { success: false });
  const body = request.body || {};
  const token = body.gender === 'female' ? process.env.PULSEFIT_GIRLS_BOT_TOKEN : process.env.PULSEFIT_BOYS_BOT_TOKEN;
  const chatId = String(process.env.TELEGRAM_CHAT_ID || '');
  if (!token || !chatId) return sendJson(response, 503, { success: false, message: 'Telegram bot configuration is missing.' });
  const text = [`New ${body.gender === 'female' ? 'female' : 'male'} PulseFit registration`, `Name: ${String(body.firstName || '').trim()} ${String(body.lastName || '').trim()}`.trim(), `Age: ${body.age ?? 0}`, `Height: ${body.height ?? 0} cm`, `Weight: ${body.weight ?? 0} kg`, `Governorate: ${body.governorate || 'Not provided'}`, `User ID: ${body.userId}`, `Email: ${body.email}`].join('\n');
  const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
  return sendJson(response, telegramResponse.ok ? 200 : 502, { success: telegramResponse.ok });
}