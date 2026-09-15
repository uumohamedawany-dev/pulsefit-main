import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://xrpxpvlsrdcnhydozywj.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || 'sb_publishable_X2P3Wj9qrdSzGUiyP_aRAQ_1skhLMay';
export const MASTER_ADMIN_EMAIL = 'uu.mohamed.awany@gmail.com';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface PulseFitProfilePayload {
  user_id?: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  governorate?: string | null;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
}

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
}

export async function signUp(payload: PulseFitProfilePayload & { password: string }) {
  const { password, ...metadata } = payload;
  return supabase.auth.signUp({
    email: payload.email.trim().toLowerCase(),
    password,
    options: { data: metadata },
  });
}

export function mapSupabaseUser(user: SupabaseUser) {
  const metadata = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    firstName: metadata.first_name || metadata.firstName || metadata.username || user.email?.split('@')[0] || 'Athlete',
    lastName: metadata.last_name || metadata.lastName || '',
    gender: metadata.gender === 'female' ? 'female' as const : 'male' as const,
    governorate: metadata.governorate || null,
    age: Number(metadata.age) || undefined,
    weight: Number(metadata.weight) || undefined,
    height: Number(metadata.height) || undefined,
    goal: metadata.goal || 'maintenance',
    createdAt: user.created_at,
    subscriptionStatus: 'trial' as const,
  };
}

export async function upsertUserProfile(profile: PulseFitProfilePayload) {
  return supabase.from('users_data').upsert(profile, { onConflict: 'user_id' }).select().single();
}

export async function ensureMasterAdminProfile(userId: string, email: string) {
  const profile = {
    user_id: userId,
    email,
    username: 'yahiaawany',
    first_name: 'Yahia',
    last_name: 'Awany',
    gender: 'male' as const,
    governorate: 'Alexandria',
    age: 18,
    height: 177,
    weight: 63,
    goal: 'maintenance',
  } satisfies PulseFitProfilePayload;

  const { data, error } = await upsertUserProfile(profile);
  if (error) {
    throw error;
  }

  return data;
}

export async function fetchCurrentUserProfile(userId: string) {
  return supabase.from('users_data').select('*').eq('user_id', userId).maybeSingle();
}

export async function fetchUserWorkouts(userId: string) {
  return supabase.from('workouts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export async function saveUserWorkout(userId: string, workout: Record<string, unknown>) {
  return supabase.from('workouts').insert({ ...workout, user_id: userId }).select().single();
}

export interface SupabasePaymentPayload {
  user_id: string;
  email: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
  receipt_url?: string | null;
  receipt_data_url?: string | null;
  status?: 'pending' | 'approved' | 'declined';
  amount?: number;
}

export async function createPayment(payload: SupabasePaymentPayload) {
  return supabase.from('payments').insert({ ...payload, status: payload.status || 'pending' }).select().single();
}

export async function fetchUserPayments(userId: string) {
  return supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}
