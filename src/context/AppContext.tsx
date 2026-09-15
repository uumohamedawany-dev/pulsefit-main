import type { Screen, User, WorkoutType, OnboardingProfile, AuthMode, MealEntry, QuickAddMealInput, DailyStats, InBodyRecord, InBodyRecordInput, AppMode, WaterLogEntry, MetricHistoryEntry } from '@/types';
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { calculateOfflineMacros } from '@/lib/macros';
import { fetchUserProfile, isAdminUser, isMasterAdminUser, saveExercisePr, submitWorkoutCheckIn, syncActivityBatch, syncHealthSnapshot, updateUserProfile, type ActivitySyncEntry } from '@/lib/api';
import {
  DEFAULT_SECURITY_SETTINGS,
  clearSecureSessionToken,
  loadSecuritySettings,
  saveSecuritySettings,
  safeReadStorage,
  safeRemoveStorage,
  safeWriteStorage,
  type SecuritySettings,
} from '@/lib/permissions';
import { dailyStats as starterDailyStats } from '@/data/mockData';
import { translate, type Language } from '@/lib/i18n';

export type ThemeMode = 'dark' | 'light';

interface AppState {
  currentScreen: Screen;
  user: User | null;
  isAuthenticated: boolean;
  workoutType: WorkoutType;
  offlineMacros: boolean;
  onboardingProfile: OnboardingProfile | null;
  macroCalculation: ReturnType<typeof calculateOfflineMacros> | null;
  theme: ThemeMode;
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  appMode: AppMode;
  streakDays: number;
  isStreakSaverActive: boolean;
  streakSaverDays: number;
  dailyStats: DailyStats;
  metricHistory: MetricHistoryEntry[];
  securitySettings: SecuritySettings;
  biometricPromptPending: boolean;
  isOffline: boolean;
  lastSyncAt: string | null;
  points: number;
  badges: string[];
  updateDailyStats: (updates: Partial<DailyStats>) => void;
  addSteps: (steps: number) => void;
  customMealEntries: MealEntry[];
  inBodyRecords: InBodyRecord[];
  markStreakActivity: () => void;
  completeWorkout: () => void;
  submitWorkoutCheckIn: (note: string) => Promise<{ success: boolean; message?: string }>;
  saveExercisePr: (exerciseName: string, value: string) => Promise<{ success: boolean; message?: string }>;
  syncLocalState: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  setScreen: (screen: Screen) => void;
  login: (user: User, mode?: AuthMode) => void;
  logout: () => void;
  completeOnboarding: (profile: OnboardingProfile) => void;
  setOnboardingProfile: (profile: OnboardingProfile) => void;
  setWorkoutType: (type: WorkoutType) => void;
  setOfflineMacros: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAppMode: (mode: AppMode) => void;
  setStreakDays: (days: number) => void;
  incrementStreakDays: () => void;
  activateStreakSaver: (days: number) => void;
  clearStreakSaver: () => void;
  consumeStreakSaverDay: () => void;
  updateSecuritySettings: (settings: SecuritySettings) => void;
  setBiometricPromptPending: (enabled: boolean) => void;
  addCustomMealEntry: (entry: QuickAddMealInput) => void;
  logWater: (amountMl?: number) => void;
  addInBodyRecord: (record: InBodyRecordInput) => void;
}

const AppContext = createContext<AppState | null>(null);

const getLocalDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readStoredOnboardingProfile = (): OnboardingProfile | null => {
  const rawProfile = safeReadStorage('pulsefit.onboardingProfile');

  if (!rawProfile) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawProfile) as Partial<OnboardingProfile>;

    if (!parsed || parsed.gender !== 'male' && parsed.gender !== 'female') {
      return null;
    }

    const gender = parsed.gender;
    const age = Number(parsed.age) > 0 ? Number(parsed.age) : 28;
    const weight = Number(parsed.weight) > 0 ? Number(parsed.weight) : 72;
    const height = Number(parsed.height) > 0 ? Number(parsed.height) : 176;
    const goal = parsed.goal === 'cutting' || parsed.goal === 'bulking' || parsed.goal === 'maintenance' ? parsed.goal : 'maintenance';
    const activityLevel = parsed.activityLevel === 'light' || parsed.activityLevel === 'moderate' || parsed.activityLevel === 'high' || parsed.activityLevel === 'athlete' ? parsed.activityLevel : 'sedentary';

    return {
      gender,
      age,
      weight,
      height,
      goal,
      activityLevel,
    };
  } catch {
    return null;
  }
};

const readStoredUser = (): User | null => {
  const rawUser = safeReadStorage('pulsefit.user');

  if (!rawUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser) as Partial<User>;

    if (!parsed?.email) {
      return null;
    }

    return {
      id: parsed.id,
      publicUserId: parsed.publicUserId,
      governorate: parsed.governorate ?? null,
      createdAt: parsed.createdAt,
      firstName: parsed.firstName ?? 'Pulse',
      lastName: parsed.lastName ?? '',
      email: parsed.email,
      avatar: parsed.avatar ?? null,
      profilePicture: parsed.profilePicture ?? null,
      gender: parsed.gender ?? 'male',
      weight: Number(parsed.weight) > 0 ? Number(parsed.weight) : undefined,
      height: Number(parsed.height) > 0 ? Number(parsed.height) : undefined,
      age: Number(parsed.age) > 0 ? Number(parsed.age) : undefined,
      streakDays: Number(parsed.streakDays) > 0 ? Number(parsed.streakDays) : 0,
      points: Number(parsed.points) >= 0 ? Number(parsed.points) : 0,
      badges: Array.isArray(parsed.badges) ? parsed.badges.filter((badge): badge is string => typeof badge === 'string') : [],
      subscriptionPlan: parsed.subscriptionPlan,
      subscriptionStatus: parsed.subscriptionStatus ?? 'trial',
      subscriptionExpiresAt: parsed.subscriptionExpiresAt ?? null,
      goal: parsed.goal ?? 'maintenance',
    };
  } catch {
    return null;
  }
};

const readStoredDailyStats = (): DailyStats => {
  const rawStats = safeReadStorage('pulsefit.dailyStats');

  if (!rawStats) {
    return { ...starterDailyStats };
  }

  try {
    const parsed = JSON.parse(rawStats) as Partial<DailyStats>;
    return {
      ...starterDailyStats,
      ...parsed,
      steps: Number(parsed.steps) || 0,
      activeCalories: Number(parsed.activeCalories) || 0,
      waterConsumed: Number(parsed.waterConsumed) || 0,
    };
  } catch {
    return { ...starterDailyStats };
  }
};

const readStoredCustomMealEntries = (): MealEntry[] => {
  const rawEntries = safeReadStorage('pulsefit.customMealEntries');

  if (!rawEntries) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawEntries) as MealEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readStoredInBodyRecords = (): InBodyRecord[] => {
  const rawRecords = safeReadStorage('pulsefit.inBodyRecords');

  if (!rawRecords) {
    return [
      {
        id: 'seed-inbody-1',
        date: new Date().toISOString(),
        weight: 79,
        bodyFatPercentage: 18,
        muscleMass: 34,
        notes: 'Good body-composition trend',
      },
    ];
  }

  try {
    const parsed = JSON.parse(rawRecords) as InBodyRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [
      {
        id: 'seed-inbody-1',
        date: new Date().toISOString(),
        weight: 79,
        bodyFatPercentage: 18,
        muscleMass: 34,
        notes: 'Good body-composition trend',
      },
    ];
  } catch {
    return [
      {
        id: 'seed-inbody-1',
        date: new Date().toISOString(),
        weight: 79,
        bodyFatPercentage: 18,
        muscleMass: 34,
        notes: 'Good body-composition trend',
      },
    ];
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [workoutType, setWorkoutType] = useState<WorkoutType>('gym');
  const [offlineMacros, setOfflineMacros] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(() => readStoredOnboardingProfile());
  const [macroCalculation, setMacroCalculation] = useState<ReturnType<typeof calculateOfflineMacros> | null>(null);
  const [customMealEntries, setCustomMealEntries] = useState<MealEntry[]>(() => readStoredCustomMealEntries());
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const savedDayStartedAt = Number(safeReadStorage('pulsefit.waterDayStartedAt') || 0);
    if (!savedDayStartedAt) safeWriteStorage('pulsefit.waterDayStartedAt', String(Date.now()));
    return readStoredDailyStats();
  });
  const [waterHistory, setWaterHistory] = useState<WaterLogEntry[]>(() => {
    const raw = safeReadStorage('pulsefit.waterHistory');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(-365) : [];
    } catch {
      return [];
    }
  });
  const [metricHistory, setMetricHistory] = useState<MetricHistoryEntry[]>(() => {
    const raw = safeReadStorage('pulsefit.metricHistory');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(-366) : [];
    } catch {
      return [];
    }
  });
  const [streakDays, setStreakDays] = useState<number>(() => Number(safeReadStorage('pulsefit.streakDays') ?? '0'));
  const [isStreakSaverActive, setIsStreakSaverActive] = useState<boolean>(() => safeReadStorage('pulsefit.streakSaverActive') === 'true' && readStoredOnboardingProfile()?.gender === 'female');
  const [streakSaverDays, setStreakSaverDays] = useState<number>(() => {
    const saved = Number(safeReadStorage('pulsefit.streakSaverDays') ?? safeReadStorage('pulsefit.streakSaverDaysRemaining') ?? '0');
    return Number.isFinite(saved) ? Math.max(0, saved) : 0;
  });
  const [streakFrozenAt, setStreakFrozenAt] = useState<string | null>(() => safeReadStorage('pulsefit.streakFrozenAt'));
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const storedProfile = readStoredOnboardingProfile();
    const stored = safeReadStorage('pulsefit.appMode');
    return storedProfile?.gender || (stored === 'female' ? 'female' : 'male');
  });
  const [inBodyRecords, setInBodyRecords] = useState<InBodyRecord[]>(() => readStoredInBodyRecords());
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = safeReadStorage('pulsefit.theme');
    return stored === 'light' ? 'light' : 'dark';
  });
  const [language, setLanguageState] = useState<Language>(() => safeReadStorage('pulsefit.language') === 'ar' ? 'ar' : 'en');
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS);
  const [biometricPromptPending, setBiometricPromptPending] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator === 'undefined' ? false : !navigator.onLine);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(() => safeReadStorage('pulsefit.lastSyncAt'));
  const [points, setPoints] = useState<number>(() => Number(safeReadStorage('pulsefit.points') ?? '0'));
  const [badges, setBadges] = useState<string[]>(() => {
    const raw = safeReadStorage('pulsefit.badges');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((badge): badge is string => typeof badge === 'string') : [];
    } catch {
      return [];
    }
  });
  const [pendingActivities, setPendingActivities] = useState<ActivitySyncEntry[]>(() => {
    const raw = safeReadStorage('pulsefit.pendingActivities');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    safeWriteStorage('pulsefit.language', nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  const t = useCallback((key: string, fallback = key) => translate(language, key, fallback), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    if (user?.gender === 'female' || onboardingProfile?.gender === 'female') {
      return;
    }

    setIsStreakSaverActive(false);
    setStreakSaverDays(0);
    setStreakFrozenAt(null);
    safeWriteStorage('pulsefit.streakSaverActive', 'false');
    safeWriteStorage('pulsefit.streakSaverDays', '0');
    safeWriteStorage('pulsefit.streakSaverDaysRemaining', '0');
    safeRemoveStorage('pulsefit.streakFrozenAt');
  }, [onboardingProfile?.gender, user?.gender]);

  useEffect(() => {
    void loadSecuritySettings().then((settings) => {
      setSecuritySettings(settings);
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      safeWriteStorage('pulsefit.user', JSON.stringify(user));
    } else {
      safeRemoveStorage('pulsefit.user');
    }
  }, [user]);

  useEffect(() => {
    safeWriteStorage('pulsefit.dailyStats', JSON.stringify(dailyStats));
  }, [dailyStats]);

  useEffect(() => {
    safeWriteStorage('pulsefit.waterHistory', JSON.stringify(waterHistory.slice(-365)));
  }, [waterHistory]);

  useEffect(() => {
    safeWriteStorage('pulsefit.metricHistory', JSON.stringify(metricHistory.slice(-366)));
  }, [metricHistory]);

  useEffect(() => {
    const dayKey = getLocalDayKey();
    const previousDayKey = safeReadStorage('pulsefit.metricDayKey');

    if (previousDayKey && previousDayKey !== dayKey) {
      setDailyStats((current) => ({ ...current, steps: 0, activeCalories: 0, waterConsumed: 0 }));
      safeWriteStorage('pulsefit.waterDayStartedAt', String(Date.now()));
    }

    safeWriteStorage('pulsefit.metricDayKey', dayKey);
    const timer = window.setInterval(() => {
      const currentDayKey = getLocalDayKey();
      const savedDayKey = safeReadStorage('pulsefit.metricDayKey');
      if (savedDayKey === currentDayKey) return;
      setMetricHistory((current) => current);
      setDailyStats((current) => ({ ...current, steps: 0, activeCalories: 0, waterConsumed: 0 }));
      safeWriteStorage('pulsefit.metricDayKey', currentDayKey);
      safeWriteStorage('pulsefit.waterDayStartedAt', String(Date.now()));
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const dayKey = getLocalDayKey();
    setMetricHistory((current) => {
      const nextEntry = { dayKey, steps: dailyStats.steps, activeCalories: dailyStats.activeCalories, waterConsumed: dailyStats.waterConsumed, streakDays };
      const withoutToday = current.filter((entry) => entry.dayKey !== dayKey);
      return [...withoutToday, nextEntry].slice(-366);
    });
  }, [dailyStats.activeCalories, dailyStats.steps, dailyStats.waterConsumed, streakDays]);

  useEffect(() => {
    if (!onboardingProfile?.weight) {
      return;
    }

    const dailyWaterCups = Math.max(6, Math.ceil((onboardingProfile.weight * 35) / 250));
    setDailyStats((current) => current.waterGoal === dailyWaterCups ? current : {
      ...current,
      waterGoal: dailyWaterCups,
    });
  }, [onboardingProfile?.weight]);

  useEffect(() => {
    safeWriteStorage('pulsefit.customMealEntries', JSON.stringify(customMealEntries));
  }, [customMealEntries]);

  useEffect(() => {
    safeWriteStorage('pulsefit.inBodyRecords', JSON.stringify(inBodyRecords));
  }, [inBodyRecords]);

  useEffect(() => {
    safeWriteStorage('pulsefit.lastSyncAt', lastSyncAt ?? '');
  }, [lastSyncAt]);

  useEffect(() => {
    safeWriteStorage('pulsefit.points', String(points));
    safeWriteStorage('pulsefit.badges', JSON.stringify(badges));
  }, [badges, points]);

  useEffect(() => {
    safeWriteStorage('pulsefit.pendingActivities', JSON.stringify(pendingActivities));
  }, [pendingActivities]);

  const queueActivity = useCallback((activity: Omit<ActivitySyncEntry, 'id' | 'timestamp'>) => {
    setPendingActivities((current) => [...current, {
      ...activity,
      id: `activity-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const syncLocalState = useCallback(async () => {
    if (isOffline || !user?.email || !onboardingProfile) {
      return;
    }

    try {
      await updateUserProfile({
        email: user.email,
        username: user.email.split('@')[0],
        gender: onboardingProfile.gender,
        weight: onboardingProfile.weight,
        height: onboardingProfile.height,
        age: onboardingProfile.age,
        streakDays,
        points,
        badges,
        goal: onboardingProfile.goal,
      });

      await syncHealthSnapshot({
        email: user.email,
        steps: dailyStats.steps,
        activeCalories: dailyStats.activeCalories,
        sleepHours: dailyStats.sleepHours,
        streakFrozen: isStreakSaverActive,
        streakFreezeDays: streakSaverDays,
        streakFrozenAt,
        timestamp: new Date().toISOString(),
      });

      if (pendingActivities.length > 0) {
        await syncActivityBatch({ email: user.email, activities: pendingActivities });
        setPendingActivities([]);
      }

      const nextSyncAt = new Date().toISOString();
      setLastSyncAt(nextSyncAt);
      safeWriteStorage('pulsefit.lastSyncAt', nextSyncAt);
      setIsOffline(false);
    } catch {
      setIsOffline(true);
    }
  }, [badges, dailyStats.activeCalories, dailyStats.sleepHours, dailyStats.steps, isOffline, isStreakSaverActive, onboardingProfile, pendingActivities, points, streakDays, streakFrozenAt, streakSaverDays, user]);

  const refreshUserProfile = useCallback(async () => {
    if (!user?.email || isOffline) return;
    try {
      const remoteUser = await fetchUserProfile(user.email);
      setUser((current) => current ? { ...current, ...remoteUser } : current);
    } catch {
      // Profile refresh is best-effort while offline or during a backend restart.
    }
  }, [isOffline, user?.email]);

  useEffect(() => {
    if (!isOffline && user?.email) {
      void syncLocalState();
    }
  }, [isOffline, syncLocalState, user?.email]);

  const login = useCallback((u: User, mode: AuthMode = 'login') => {
    const storedProfile = readStoredOnboardingProfile();
    const hydratedUser: User = {
      ...u,
      gender: u.gender ?? storedProfile?.gender,
      weight: Number(u.weight) > 0 ? Number(u.weight) : storedProfile?.weight,
      height: Number(u.height) > 0 ? Number(u.height) : storedProfile?.height,
      age: Number(u.age) > 0 ? Number(u.age) : storedProfile?.age,
      streakDays: Number(u.streakDays) > 0 ? Number(u.streakDays) : storedProfile ? 0 : u.streakDays,
      points: Number(u.points) >= 0 ? Number(u.points) : points,
      badges: Array.isArray(u.badges) ? u.badges : badges,
      goal: u.goal ?? storedProfile?.goal ?? 'maintenance',
    };

    const resolvedProfile = storedProfile ?? {
      gender: hydratedUser.gender ?? 'male',
      age: Number(hydratedUser.age) > 0 ? Number(hydratedUser.age) : 28,
      weight: Number(hydratedUser.weight) > 0 ? Number(hydratedUser.weight) : 72,
      height: Number(hydratedUser.height) > 0 ? Number(hydratedUser.height) : 176,
      goal: hydratedUser.goal ?? 'maintenance',
    };

    const profileComplete = !!(
      hydratedUser.gender &&
      Number(hydratedUser.weight) > 0 &&
      Number(hydratedUser.height) > 0 &&
      Number(hydratedUser.age) > 0
    );

    if (hydratedUser.gender) {
      setAppMode(hydratedUser.gender);
    }

    if (profileComplete) {
      setOnboardingProfile(resolvedProfile);
      safeWriteStorage('pulsefit.onboardingProfile', JSON.stringify(resolvedProfile));
    }

    setUser(hydratedUser);
    setCurrentScreen(isAdminUser(hydratedUser) && !isMasterAdminUser(hydratedUser) ? 'admin' : profileComplete ? 'dashboard' : 'onboarding');
    setBiometricPromptPending(!securitySettings.biometricPromptSeen && !isAdminUser(hydratedUser));
  }, [badges, points, securitySettings.biometricPromptSeen]);

  const completeOnboarding = useCallback((profile: OnboardingProfile) => {
    const normalizedProfile = {
      ...profile,
      gender: profile.gender ?? 'male',
      age: Number(profile.age) > 0 ? Number(profile.age) : 28,
      weight: Number(profile.weight) > 0 ? Number(profile.weight) : 72,
      height: Number(profile.height) > 0 ? Number(profile.height) : 176,
      goal: profile.goal ?? 'maintenance',
    };

    setOnboardingProfile(normalizedProfile);
    safeWriteStorage('pulsefit.onboardingProfile', JSON.stringify(normalizedProfile));
    setMacroCalculation(calculateOfflineMacros(normalizedProfile));
    setCurrentScreen('dashboard');
  }, []);

  const applyOnboardingProfile = useCallback((profile: OnboardingProfile) => {
    setOnboardingProfile(profile);
    safeWriteStorage('pulsefit.onboardingProfile', JSON.stringify(profile));
    setMacroCalculation(calculateOfflineMacros(profile));
  }, []);

  const logout = useCallback(() => {
    void clearSecureSessionToken();
    setUser(null);
    setOnboardingProfile(null);
    setMacroCalculation(null);
    setBiometricPromptPending(false);
    safeRemoveStorage('pulsefit.user');
    safeRemoveStorage('pulsefit.onboardingProfile');
    setCurrentScreen('auth');
  }, []);

  const updateStreakDays = useCallback((days: number) => {
    setStreakDays(days);
    safeWriteStorage('pulsefit.streakDays', String(days));
  }, []);

  const incrementStreakDays = useCallback(() => {
    setStreakDays((current) => {
      const next = current + 1;
      safeWriteStorage('pulsefit.streakDays', String(next));
      return next;
    });
  }, []);

  const markStreakActivity = useCallback(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastSavedDay = safeReadStorage('pulsefit.lastStreakDate');

    if (lastSavedDay === todayKey) {
      return;
    }

    setStreakDays((current) => {
      const next = current + 1;
      safeWriteStorage('pulsefit.streakDays', String(next));
      safeWriteStorage('pulsefit.lastStreakDate', todayKey);
      setPoints((value) => value + 5 + (next % 7 === 0 ? 100 : 0));
      setBadges((currentBadges) => {
        const earned = [
          next >= 3 ? '3 Day Spark' : null,
          next >= 7 ? '7 Day Fire' : null,
          next >= 30 ? '30 Day Legend' : null,
        ].filter((badge): badge is string => Boolean(badge));
        return [...new Set([...currentBadges, ...earned])];
      });
      return next;
    });
  }, []);

  const completeWorkout = useCallback(() => {
    setPoints((value) => value + 25);
    setDailyStats((current) => ({ ...current, activeCalories: current.activeCalories + 25 }));
    queueActivity({ type: 'workout' });
    markStreakActivity();
  }, [markStreakActivity, queueActivity]);

  const submitWorkoutCheckInEntry = useCallback(async (note: string) => {
    if (!user?.email) return { success: false, message: 'لازم تسجل دخول الأول.' };
    const cleanedNote = note.trim();
    if (cleanedNote.length < 3 || cleanedNote.includes('\n')) {
      return { success: false, message: 'اكتب ملاحظة قصيرة في سطر واحد.' };
    }

    const response = await submitWorkoutCheckIn({ email: user.email, note: cleanedNote });
    if (response.success) {
      queueActivity({ type: 'workout', note: cleanedNote });
      markStreakActivity();
    }
    return response;
  }, [markStreakActivity, queueActivity, user?.email]);

  const saveExercisePrEntry = useCallback(async (exerciseName: string, value: string) => {
    if (!user?.email) return { success: false, message: 'لازم تسجل دخول الأول.' };
    return saveExercisePr({ email: user.email, exerciseName, value: value.trim() });
  }, [user?.email]);

  const activateStreakSaver = useCallback((days: number) => {
    if (user?.gender !== 'female' && onboardingProfile?.gender !== 'female') {
      return;
    }

    const normalized = Math.min(7, Math.max(3, Number(days) || 3));
    setIsStreakSaverActive(true);
    setStreakSaverDays(normalized);
    safeWriteStorage('pulsefit.streakSaverActive', 'true');
    safeWriteStorage('pulsefit.streakSaverDays', String(normalized));
    safeWriteStorage('pulsefit.streakSaverDaysRemaining', String(normalized));
    const frozenAt = new Date().toISOString();
    setStreakFrozenAt(frozenAt);
    safeWriteStorage('pulsefit.streakFrozenAt', frozenAt);
  }, [onboardingProfile?.gender, user?.gender]);

  const clearStreakSaver = useCallback(() => {
    setIsStreakSaverActive(false);
    setStreakSaverDays(0);
    safeWriteStorage('pulsefit.streakSaverActive', 'false');
    safeWriteStorage('pulsefit.streakSaverDays', '0');
    safeWriteStorage('pulsefit.streakSaverDaysRemaining', '0');
    setStreakFrozenAt(null);
    safeRemoveStorage('pulsefit.streakFrozenAt');
  }, []);

  const consumeStreakSaverDay = useCallback(() => {
    setStreakSaverDays((current) => {
      const next = Math.max(0, current - 1);
      if (next <= 0) {
        setIsStreakSaverActive(false);
        safeWriteStorage('pulsefit.streakSaverActive', 'false');
      }
      safeWriteStorage('pulsefit.streakSaverDays', String(next));
      safeWriteStorage('pulsefit.streakSaverDaysRemaining', String(next));
      return next;
    });
  }, []);

  const setScreen = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const updateTheme = useCallback((nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    safeWriteStorage('pulsefit.theme', nextTheme);
  }, []);

  const updateSecuritySettings = useCallback((nextSettings: SecuritySettings) => {
    setSecuritySettings(nextSettings);
    void saveSecuritySettings(nextSettings);
  }, []);

  const toggleTheme = useCallback(() => {
    updateTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, updateTheme]);

  const updateAppMode = useCallback((mode: AppMode) => {
    setAppMode(mode);
    safeWriteStorage('pulsefit.appMode', mode);
  }, []);

  const updateDailyStats = useCallback((updates: Partial<DailyStats>) => {
    setDailyStats((current) => ({
      ...current,
      ...updates,
    }));
  }, []);

  const addSteps = useCallback((steps: number) => {
    const increment = Math.max(0, Math.floor(steps));
    if (!increment) return;
    setDailyStats((current) => ({ ...current, steps: current.steps + increment }));
  }, []);

  const logWater = useCallback((amountMl = 250) => {
    const dayStartedAt = Number(safeReadStorage('pulsefit.waterDayStartedAt') || 0);
    if (!dayStartedAt || Date.now() - dayStartedAt >= 24 * 60 * 60 * 1000) {
      safeWriteStorage('pulsefit.waterDayStartedAt', String(Date.now()));
      setDailyStats((current) => ({ ...current, waterConsumed: 0 }));
    }
    const amountCups = Math.max(0.25, amountMl / 250);
    setDailyStats((current) => ({
      ...current,
      waterConsumed: Number((current.waterConsumed + amountCups).toFixed(2)),
    }));
    setWaterHistory((current) => [...current, {
      id: `water-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      amountMl,
      createdAt: new Date().toISOString(),
      dayKey: new Date().toISOString().slice(0, 10),
    }]);
    queueActivity({ type: 'water', amount: amountMl });
    markStreakActivity();
  }, [markStreakActivity, queueActivity]);

  const addCustomMealEntry = useCallback((entry: QuickAddMealInput) => {
    const calories = Number(entry.calories) || 0;
    const protein = Number(entry.protein ?? 0) || 0;
    const carbs = Number(entry.carbs ?? 0) || 0;
    const fat = Number(entry.fat ?? 0) || 0;

    const created: MealEntry = {
      id: `custom-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      name: (entry.name ?? 'Custom Meal').trim() || 'Custom Meal',
      calories,
      protein,
      carbs,
      fat,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: 'custom',
      source: 'custom',
    };

    setCustomMealEntries((items) => [...items, created]);
    setDailyStats((current) => ({
      ...current,
      caloriesConsumed: current.caloriesConsumed + calories,
      proteinConsumed: current.proteinConsumed + protein,
      carbsConsumed: current.carbsConsumed + carbs,
      fatConsumed: current.fatConsumed + fat,
    }));
    queueActivity({ type: 'meal', calories });
    markStreakActivity();
  }, [markStreakActivity, queueActivity]);

  const addInBodyRecord = useCallback((record: InBodyRecordInput) => {
    const weight = Number(record.weight);
    const bodyFat = Number(record.bodyFatPercentage);
    const muscleMass = record.muscleMass == null ? undefined : Number(record.muscleMass);
    const waist = record.waist == null ? undefined : Number(record.waist);
    const chest = record.chest == null ? undefined : Number(record.chest);
    const arms = record.arms == null ? undefined : Number(record.arms);

    if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(bodyFat) || bodyFat < 0 || bodyFat > 100) {
      return;
    }

    const next: InBodyRecord = {
      id: `inbody-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      date: record.date ?? new Date().toISOString(),
      weight,
      bodyFatPercentage: bodyFat,
      muscleMass: Number.isFinite(muscleMass ?? NaN) ? muscleMass : undefined,
      waist: Number.isFinite(waist ?? NaN) ? waist : undefined,
      chest: Number.isFinite(chest ?? NaN) ? chest : undefined,
      arms: Number.isFinite(arms ?? NaN) ? arms : undefined,
      photoDataUrl: record.photoDataUrl,
      notes: record.notes?.trim(),
    };

    setInBodyRecords((items) => [next, ...items]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        user,
        isAuthenticated: !!user,
        workoutType,
        offlineMacros,
        onboardingProfile,
        macroCalculation,
        theme,
        language,
        setLanguage,
        toggleLanguage,
        t,
        appMode,
        streakDays,
        isStreakSaverActive,
        streakSaverDays,
        dailyStats,
          metricHistory,
        securitySettings,
        biometricPromptPending,
        isOffline,
        lastSyncAt,
        points,
        badges,
        updateDailyStats,
          addSteps,
        customMealEntries,
        inBodyRecords,
        markStreakActivity,
        completeWorkout,
        submitWorkoutCheckIn: submitWorkoutCheckInEntry,
        saveExercisePr: saveExercisePrEntry,
        syncLocalState,
        refreshUserProfile,
        setScreen,
        login,
        logout,
        completeOnboarding,
        setOnboardingProfile: applyOnboardingProfile,
        setWorkoutType,
        setOfflineMacros,
        setTheme: updateTheme,
        toggleTheme,
        setAppMode: updateAppMode,
        setStreakDays: updateStreakDays,
        incrementStreakDays,
        activateStreakSaver,
        clearStreakSaver,
        consumeStreakSaverDay,
        updateSecuritySettings,
        setBiometricPromptPending,
        addCustomMealEntry,
        logWater,
        addInBodyRecord,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
