import { requireAdmin, sendJson } from '../../_auth.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return sendJson(response, 405, { success: false, message: 'Method not allowed.' });
  const action = request.query.action;
  if (!['approve', 'decline'].includes(action)) return sendJson(response, 400, { success: false, message: 'Unsupported subscription action.' });

  try {
    const admin = await requireAdmin(request);
    const paymentId = Number(request.query.id);
    if (!Number.isInteger(paymentId)) return sendJson(response, 400, { success: false, message: 'Invalid subscription request.' });

    const { data: payment, error: paymentError } = await admin.from('payments').select('*').eq('id', paymentId).maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) return sendJson(response, 404, { success: false, message: 'Subscription request not found.' });

    if (action === 'decline') {
      const { error } = await admin.from('payments').update({ status: 'declined', reviewed_at: new Date().toISOString() }).eq('id', paymentId);
      if (error) throw error;
      return sendJson(response, 200, { success: true, message: 'Subscription request declined and marked for re-upload.' });
    }

    const expiresAt = payment.plan === 'lifetime'
      ? null
      : new Date(Date.now() + (payment.plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString();
    const { error: paymentUpdateError } = await admin.from('payments').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', paymentId);
    if (paymentUpdateError) throw paymentUpdateError;

    const { error: profileError } = await admin.from('users_data').update({ subscription_status: 'active', subscription_plan: payment.plan, subscription_expires_at: expiresAt, updated_at: new Date().toISOString() }).eq('user_id', payment.user_id);
    if (profileError) throw profileError;

    return sendJson(response, 200, { success: true, message: 'Subscription approved and Pro activated.' });
  } catch (error) {
    return sendJson(response, error.status || 500, { success: false, message: error.message || 'Unable to update subscription request.' });
  }
}
