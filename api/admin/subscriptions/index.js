import { requireAdmin, sendJson } from '../_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return sendJson(response, 405, { success: false, message: 'Method not allowed.' });

  try {
    const admin = await requireAdmin(request);
    const { data: payments, error } = await admin.from('payments').select('*').in('status', ['pending', 'declined']).order('created_at', { ascending: false });
    if (error) throw error;

    const requests = await Promise.all((payments || []).map(async (payment) => {
      const { data: profile } = await admin.from('users_data').select('username, first_name, last_name').eq('user_id', payment.user_id).maybeSingle();
      let receiptDataUrl = '';
      if (payment.receipt_url) {
        const { data: signed } = await admin.storage.from('payment-proofs').createSignedUrl(payment.receipt_url, 300);
        receiptDataUrl = signed?.signedUrl || '';
      }
      return {
        id: String(payment.id),
        email: payment.email,
        username: profile?.username || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || payment.email.split('@')[0],
        plan: payment.plan,
        receiptDataUrl,
        receiptPath: payment.receipt_url,
        status: payment.status,
        createdAt: payment.created_at,
      };
    }));

    return sendJson(response, 200, requests);
  } catch (error) {
    return sendJson(response, error.status || 500, { success: false, message: error.message || 'Unable to load subscription requests.' });
  }
}
