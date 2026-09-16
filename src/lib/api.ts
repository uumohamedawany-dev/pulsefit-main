import { saveSecureSessionToken, safeReadStorage, safeWriteStorage } from '@/lib/permissions';
import { supabase } from '@/lib/supabaseClient';
import type { SubscriptionPlan } from '@/types';

export interface AuthApiUser {
  createdAt?: string;
  publicUserId?: string;
  governorate?: string | null;
  firstName: string;
  lastName?: string;
  email: string;
  avatar?: string | null;
  profilePicture?: string | null;
  id?: string;
  points?: number;
  badges?: string[];
  completedWorkouts?: number;
  goalsCompleted?: number;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'pending';
  subscriptionExpiresAt?: string | null;
}

export interface AuthApiResponse {
  success: boolean;
  requiresOtp?: boolean;
  message?: string;
  token?: string;
  user?: AuthApiUser;
  userId?: string;
  email?: string;
}

export interface RegisterPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
  password?: string;
  gender?: 'male' | 'female';
  weight?: number;
  height?: number;
  age?: number;
  streakDays?: number;
  points?: number;
  badges?: string[];
  completedWorkouts?: number;
  goalsCompleted?: number;
  signupSource?: string;
  governorate?: string;
}

export interface ProfileUpdatePayload {
  email: string;
  username?: string;
  gender?: 'male' | 'female';
  weight?: number;
  height?: number;
  age?: number;
  streakDays?: number;
  points?: number;
  badges?: string[];
  goal?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  userId?: string;
}

export interface FoodScanResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FriendProfile {
  id: string;
  requestId?: string;
  email: string;
  username: string;
  name: string;
  streakDays: number;
  points: number;
  completedWorkouts: number;
  steps: number;
  status?: 'friend' | 'pending' | 'incoming';
}

export interface ActivitySyncEntry {
  id: string;
  type: 'meal' | 'water' | 'workout';
  amount?: number;
  calories?: number;
  timestamp: string;
  note?: string;
}

export async function saveBodyMeasurement(payload: { email: string; date: string; weight: number; waist?: number; chest?: number; arms?: number; bodyFatPercentage: number; muscleMass?: number; photoDataUrl?: string; notes?: string }): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/body/measurements', { method: 'POST', body: JSON.stringify(payload) });
}

export interface WorkoutCheckIn {
  id: string;
  email: string;
  note: string;
  createdAt: string;
}

export interface ResendOtpPayload {
  email: string;
  mode?: 'signup' | 'login';
}

export interface ContactDeveloperPayload {
  name?: string;
  email?: string;
  userId?: string;
  user_id?: string;
  message: string;
  platform?: string;
}

export interface SyncPayload {
  email?: string;
  userId?: string;
  steps?: number;
  heartRate?: number;
  activeCalories?: number;
  sleepHours?: number;
  timestamp?: string;
  streakFrozen?: boolean;
  streakFreezeDays?: number;
  streakFrozenAt?: string | null;
}

export interface AdminUserRecord {
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  streakDays?: number;
  streakWeeks?: number;
  status?: 'active' | 'suspended' | 'banned';
  isActive?: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
  lastLogin?: string;
  lastSeen?: string;
  createdAt?: string;
  deviceInfo?: Record<string, string | number | boolean | undefined>;
  activityCount?: number;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
  publicUserId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'broadcast' | 'direct' | 'subscription' | 'system';
  createdAt: string;
  read: boolean;
}

export interface SubscriptionRequest {
  id: string;
  email: string;
  username: string;
  plan: SubscriptionPlan;
  receiptDataUrl: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  receiptPath?: string | null;
}

export interface AdminUserUpdatePayload {
  username?: string;
  email?: string;
  streakDays?: number;
  status?: 'active' | 'suspended' | 'banned';
  isActive?: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
}

export interface AdminActivityLog {
  id?: string;
  type?: string;
  message?: string;
  timestamp?: string;
  userEmail?: string;
  deviceInfo?: Record<string, string | number | boolean | undefined>;
}

export interface AdminStats {
  totalUsers?: number;
  activeUsers?: number;
  totalLogins?: number;
  avgStreakDays?: number;
  systemStatus?: string;
  uptime?: string;
  lastSync?: string;
  activityLogs?: AdminActivityLog[];
  activeSessions?: number;
  scannedMeals?: number;
  feedbackLogs?: number;
  telegramMessages?: number;
  governorateAnalytics?: Array<{ governorate: string; count: number; percentage: number }>;
  genderAnalytics?: { male: { count: number; percentage: number }; female: { count: number; percentage: number } };
  userGrowthAnalytics?: Array<{ date: string; label: string; newUsers: number; cumulativeUsers: number }>;
  [key: string]: unknown;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return '';
};

const getDeviceInfo = () => ({
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
});

async function requestJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(safeReadStorage('pulsefit.adminEmail') ? { 'X-Admin-Email': safeReadStorage('pulsefit.adminEmail') as string } : {}),
        ...(safeReadStorage('pulsefit.authToken') ? { Authorization: `Bearer ${safeReadStorage('pulsefit.authToken')}` } : {}),
        ...(sessionData.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    const rawText = await response.text();
    const payload = rawText ? JSON.parse(rawText) : null;

    if (!response.ok) {
      const message = payload?.message || payload?.error || 'The PulseFit server could not complete this request.';
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Unable to reach the configured backend. Please check your Supabase/API configuration.', 0);
  }
}

export async function registerUser(payload: RegisterPayload): Promise<AuthApiResponse> {
  return requestJson<AuthApiResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: payload.username || payload.firstName || payload.email.split('@')[0],
      email: payload.email,
      password: payload.password,
      gender: payload.gender || 'male',
      weight: payload.weight ?? 0,
      height: payload.height ?? 0,
      age: payload.age ?? 0,
      governorate: payload.governorate || null,
      streakDays: payload.streakDays ?? 0,
      signupSource: payload.signupSource || 'pulsefit-web',
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function updateUserProfile(payload: ProfileUpdatePayload): Promise<AuthApiResponse> {
  const body = {
    email: payload.email,
    username: payload.username || payload.email.split('@')[0],
    gender: payload.gender || 'male',
    weight: payload.weight ?? 0,
    height: payload.height ?? 0,
    age: payload.age ?? 0,
    streakDays: payload.streakDays ?? 0,
    completedWorkouts: payload.completedWorkouts ?? 0,
    goalsCompleted: payload.goalsCompleted ?? 0,
    goal: payload.goal || 'maintenance',
    deviceInfo: getDeviceInfo(),
    timestamp: new Date().toISOString(),
  };

  try {
    return await requestJson<AuthApiResponse>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return requestJson<AuthApiResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...body,
          signupSource: 'pulsefit-web',
        }),
      });
    }

    throw error;
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthApiResponse> {
  return requestJson<AuthApiResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function ensureSupabaseMasterAdminAuth(email: string, password: string): Promise<{ success: boolean; created?: boolean; confirmed?: boolean }> {
  return requestJson<{ success: boolean; created?: boolean; confirmed?: boolean }>('/api/auth/master-admin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthApiResponse> {
  return requestJson<AuthApiResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      otp: payload.otp,
      userId: payload.userId,
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function scanFoodImage(payload: { imageBase64: string; mimeType?: string }): Promise<{ success: boolean; message?: string; data?: FoodScanResult }> {
  return requestJson<{ success: boolean; message?: string; data?: FoodScanResult }>('/api/scan-food', {
    method: 'POST',
    body: JSON.stringify({
      imageBase64: payload.imageBase64,
      mimeType: payload.mimeType || 'image/jpeg',
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function resendOtp(payload: ResendOtpPayload): Promise<AuthApiResponse> {
  return requestJson<AuthApiResponse>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      mode: payload.mode || 'signup',
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function searchFriends(email: string, query: string): Promise<FriendProfile[]> {
  return requestJson<FriendProfile[]>(`/api/friends/search?email=${encodeURIComponent(email)}&q=${encodeURIComponent(query)}`);
}

export async function fetchFriends(email: string): Promise<{ friends: FriendProfile[]; incoming: FriendProfile[]; outgoing: FriendProfile[] }> {
  return requestJson<{ friends: FriendProfile[]; incoming: FriendProfile[]; outgoing: FriendProfile[] }>(`/api/friends?email=${encodeURIComponent(email)}`);
}

export async function sendFriendRequest(fromEmail: string, toEmail: string): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ fromEmail, toEmail }),
  });
}

export async function respondToFriendRequest(email: string, requestId: string, accept: boolean): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/friends/respond', {
    method: 'POST',
    body: JSON.stringify({ email, requestId, accept }),
  });
}

export async function submitDeveloperContact(payload: ContactDeveloperPayload): Promise<{ success: boolean; message?: string; telegramSent?: boolean }> {
  return requestJson<{ success: boolean; message?: string; telegramSent?: boolean }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      platform: payload.platform || 'pulsefit-web',
      deviceInfo: getDeviceInfo(),
      timestamp: new Date().toISOString(),
    }),
  });
}

export async function syncHealthSnapshot(payload: SyncPayload): Promise<AuthApiResponse> {
  return requestJson<AuthApiResponse>('/api/sync/health', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
      deviceInfo: getDeviceInfo(),
    }),
  });
}

export async function syncActivityBatch(payload: { email: string; activities: ActivitySyncEntry[] }): Promise<AuthApiResponse> {
  return requestJson<AuthApiResponse>('/api/sync/activity', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function persistAuthSession(token?: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  await saveSecureSessionToken(token);
  return true;
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export async function updateAdminUser(userId: string, payload: AdminUserUpdatePayload): Promise<AdminUserRecord> {
  return requestJson<AdminUserRecord>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getAdminEmail(): string {
  return 'uu.mohamed.awany@gmail.com';
}

export function isAdminUser(user?: Partial<AuthApiUser> | null): boolean {
  if (!user?.email) {
    return false;
  }

  return user.email.toLowerCase() === getAdminEmail().toLowerCase();
}

export function isMasterAdminUser(user?: Partial<AuthApiUser> | null): boolean {
  return user?.email?.toLowerCase() === 'uu.mohamed.awany@gmail.com';
}

export async function fetchAdminUsers(): Promise<AdminUserRecord[]> {
  return requestJson<AdminUserRecord[]>('/api/admin/users');
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return requestJson<AdminStats>('/api/admin/stats');
}

export async function broadcastAdminAnnouncement(message: string): Promise<{ success: boolean; message?: string; delivered?: number }> {
  return requestJson<{ success: boolean; message?: string; delivered?: number }>('/api/admin/broadcast', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function submitSubscriptionRequest(payload: { email: string; username: string; plan: SubscriptionPlan; receiptDataUrl: string; accessToken?: string }): Promise<{ success: boolean; message?: string; receiptUrl?: string }> {
  const { accessToken, ...body } = payload;
  return requestJson<{ success: boolean; message?: string; receiptUrl?: string }>('/api/subscriptions/request', {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: JSON.stringify(body),
  });
}

export async function notifyTelegramRegistration(payload: { userId: string; firstName: string; lastName?: string; email: string; gender: 'male' | 'female'; age?: number; height?: number; weight?: number; governorate?: string | null }): Promise<void> {
  await requestJson('/api/telegram/user', { method: 'POST', body: JSON.stringify(payload) });
}

export async function notifyPeriodFreeze(payload: { userId?: string; name: string; age?: number; governorate?: string | null; height?: number; weight?: number; startDate: string; durationDays: number }): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/telegram/period-freeze', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchSubscriptionRequests(): Promise<SubscriptionRequest[]> {
  return requestJson<SubscriptionRequest[]>('/api/admin/subscriptions');
}

export async function reviewSubscriptionRequest(id: string, action: 'approve' | 'decline'): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>(`/api/admin/subscriptions/${encodeURIComponent(id)}/${action}`, { method: 'POST' });
}

export async function grantSubscription(email: string, plan: SubscriptionPlan): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/admin/subscriptions/grant', { method: 'POST', body: JSON.stringify({ email, plan }) });
}

export async function fetchNotifications(email: string): Promise<AppNotification[]> {
  return requestJson<AppNotification[]>(`/api/notifications?email=${encodeURIComponent(email)}`);
}

export async function fetchUserProfile(email: string): Promise<AuthApiUser> {
  return requestJson<AuthApiUser>(`/api/auth/profile?email=${encodeURIComponent(email)}`);
}

export async function markNotificationRead(email: string, id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>('/api/notifications/read', { method: 'POST', body: JSON.stringify({ email, id }) });
}

export async function sendAdminDirectMessage(publicUserId: string, message: string): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/admin/message', { method: 'POST', body: JSON.stringify({ publicUserId, message }) });
}

export async function submitWorkoutCheckIn(payload: { email: string; note: string }): Promise<{ success: boolean; message?: string; data?: WorkoutCheckIn }> {
  return requestJson<{ success: boolean; message?: string; data?: WorkoutCheckIn }>('/api/workouts/check-in', { method: 'POST', body: JSON.stringify(payload) });
}

export async function saveExercisePr(payload: { email: string; exerciseName: string; value: string }): Promise<{ success: boolean; message?: string }> {
  return requestJson<{ success: boolean; message?: string }>('/api/exercises/pr', { method: 'POST', body: JSON.stringify(payload) });
}
