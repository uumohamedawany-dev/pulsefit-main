import { createClient } from '@supabase/supabase-js';

export const ADMIN_EMAIL = 'uu.mohamed.awany@gmail.com';

export function getSupabaseConfig() {
  return {
    url: (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

export async function requireAdmin(request) {
  const config = getSupabaseConfig();
  const accessToken = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!config.url || !config.anonKey || !config.serviceKey || !accessToken) {
    const error = new Error('Admin authentication is not configured.');
    error.status = 401;
    throw error;
  }

  const authClient = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(accessToken);
  if (error || data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    const authError = new Error('Administrator authorization required.');
    authError.status = 403;
    throw authError;
  }

  return createClient(config.url, config.serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function sendJson(response, status, body) {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
}
