import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://xrpxpvlsrdcnhydozywj.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_X2P3Wj9qrdSzGUiyP_aRAQ_1skhLMay';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
