import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Flame,
  Zap,
  TrendingUp,
  Droplets,
  Footprints,
  ArrowRight,
  Target,
  CalendarCheck,
  Bell,
  Check,
  X,
  Utensils,
  Crown,
  Salad,
  TimerReset,
  Trophy,
  Settings,
  LineChart,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { GlassPanel, GlassCard, ProgressBar } from '@/components/GlassUI';
import { CircularProgress } from '@/components/CircularProgress';
import { CycleTracker } from '@/components/CycleTracker';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import { HealthDataImporter } from '@/components/HealthDataImporter';
import { LeaderboardScreen } from '@/components/LeaderboardScreen';
import { StreakLeaderboard } from '@/components/StreakLeaderboard';
import { weeklyCaloriesData } from '@/data/mockData';
import { foodDatabase, type FoodItem, type FoodGoal, type FoodBudgetLevel, type FoodPreferenceTag } from '@/data/foodDatabase';
import { scheduleHydrationReminders } from '@/lib/notifications';
import { TrialStatusBadge } from '@/components/TrialStatusBadge';
import { NotificationCenter } from '@/components/NotificationCenter';
import { NumberStepper } from '@/components/FormControls';
import { MetricTrends } from '@/components/MetricTrends';
import { useStepTracker } from '@/hooks/useStepTracker';

type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
type ReminderRecord = {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
};

type MealPlan = {
  breakfast: FoodItem | null;
  lunch: FoodItem | null;
  dinner: FoodItem | null;
  snack: FoodItem | null;
};

export function DashboardScreen() {
  const { user, macroCalculation, setScreen, onboardingProfile, setOnboardingProfile, streakDays, markStreakActivity, isStreakSaverActive, streakSaverDays, appMode, dailyStats, lastSyncAt, isOffline, logWater, points, badges, language, t, addSteps } = useApp();
  const targetCalories = macroCalculation?.targetDailyCalories ?? dailyStats.caloriesGoal;
  const remaining = Math.max(targetCalories - dailyStats.caloriesConsumed, 0);

  const defaultWeight = onboardingProfile?.weight ?? 78;
  const height = onboardingProfile?.height ?? 175;

  const [currentWeight, setCurrentWeight] = useState<number>(defaultWeight);
  const [bmiHeight, setBmiHeight] = useState<number>(height);
  const [bmiWeight, setBmiWeight] = useState<number>(defaultWeight);

  useEffect(() => {
    void scheduleHydrationReminders(language);
  }, [language]);

  useEffect(() => {
    setBmiHeight(height);
    setBmiWeight(currentWeight);
  }, [height, currentWeight]);

  const bmi = bmiWeight > 0 && bmiHeight > 0 ? Number((bmiWeight / ((bmiHeight / 100) * (bmiHeight / 100))).toFixed(1)) : 0;
  const bmiStatus = getBmiStatus(bmi);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showHealthDataImporter, setShowHealthDataImporter] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<FoodBudgetLevel>('Low');
  const [selectedGoal, setSelectedGoal] = useState<FoodGoal>('Cutting');
  const [preferences, setPreferences] = useState<FoodPreferenceTag[]>(['High Protein']);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [waterNotice, setWaterNotice] = useState('');
  const handleTrackedStep = useCallback((steps: number) => addSteps(steps), [addSteps]);

  useStepTracker({ enabled: true, onStep: handleTrackedStep });

  const [reminders, setReminders] = useState<Record<string, ReminderRecord>>({
    Breakfast: { id: 'Breakfast', label: 'Breakfast', time: '08:00', enabled: true },
    Lunch: { id: 'Lunch', label: 'Lunch', time: '13:00', enabled: true },
    Dinner: { id: 'Dinner', label: 'Dinner', time: '20:00', enabled: true },
    Snack1: { id: 'Snack1', label: 'Snack 1', time: '16:00', enabled: true },
    Snack2: { id: 'Snack2', label: 'Snack 2', time: '22:00', enabled: false },
  });

  const dietGoal = normalizeGoal(onboardingProfile?.goal ?? 'cutting');

  const meals = useMemo(() => foodDatabase.filter((food) => food.category === 'Meal'), []);

  function logCurrentWeight() {
    const value = window.prompt('Log your current weight (kg)', String(currentWeight));
    if (!value) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setCurrentWeight(parsed);
    setBmiWeight(parsed);
    if (onboardingProfile) {
      setOnboardingProfile({ ...onboardingProfile, weight: parsed });
    }
  }

  function markTodayCompleted() {
    if (isStreakSaverActive) {
      tryNotify('Streak Saver active', `Your streak is frozen for ${streakSaverDays} more day${streakSaverDays === 1 ? '' : 's'}.`);
      return;
    }

    markStreakActivity();
    tryNotify('Consistency streak updated', `You are on a ${streakDays + 1}-day streak!`);
  }

  function addWater(amountMl: number) {
    logWater(amountMl);
    const message = t('Great job! This glass of water will support your energy. 💧');
    setWaterNotice(message);
    window.setTimeout(() => setWaterNotice(''), 3200);
    tryNotify(t('Hydration time 💧'), message);
  }

  useEffect(() => {
    const reminder = window.setInterval(() => {
      if (dailyStats.waterConsumed >= dailyStats.waterGoal) {
        return;
      }

      const message = t('Have a glass of water to keep your energy up. 💧');
      setWaterNotice(message);
      tryNotify(t('Hydration reminder 💧'), message);
    }, 90 * 60 * 1000);

    return () => window.clearInterval(reminder);
  }, [dailyStats.waterConsumed, dailyStats.waterGoal, t]);

  function toggleReminder(id: string) {
    setReminders((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  }

  function updateReminderTime(id: string, value: string) {
    setReminders((prev) => ({
      ...prev,
      [id]: { ...prev[id], time: value },
    }));
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    Notification.requestPermission();
  }

  function sendReminderNotification(name: string, time: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    new Notification('PulseFit Reminder', {
      body: `${name} scheduled for ${time}`,
    });
  }

  function buildPlan() {
    let baseDB = [...foodDatabase];

    if (preferences.includes('No Fish')) {
      baseDB = baseDB.filter(item => !item.name.includes('سمك') && !item.name.includes('تونة'));
    }

    if (preferences.includes('No Meat')) {
      baseDB = baseDB.filter(item =>
        !item.name.includes('لحم') &&
        !item.name.includes('دجاج') &&
        !item.name.includes('كفتة') &&
        !item.name.includes('بانيه') &&
        !item.name.includes('شاورما')
      );
    }

    if (preferences.includes('No Dairy')) {
      baseDB = baseDB.filter(item =>
        !item.name.includes('جبنة') &&
        !item.name.includes('لبن') &&
        !item.name.includes('زبادي')
      );
    }

    if (preferences.includes('Vegetarian')) {
      baseDB = baseDB.filter(item =>
        !item.name.includes('لحم') &&
        !item.name.includes('دجاج') &&
        !item.name.includes('كفتة') &&
        !item.name.includes('بانيه') &&
        !item.name.includes('شاورما')
      );
    }

    const breakfastOptions = baseDB.filter(item => item.category === 'Breakfast');
    const mainMealOptions = baseDB.filter(item => item.category === 'Meal');
    const snackOptions = baseDB.filter(item => item.category === 'Snack' || item.category === 'Carb' || item.category === 'Fruits' || item.category === 'Vegetables');

    const shuffledBreakfast = [...breakfastOptions].sort(() => 0.5 - Math.random());
    const shuffledMainMeals = [...mainMealOptions].sort(() => 0.5 - Math.random());
    const shuffledSnacks = [...snackOptions].sort(() => 0.5 - Math.random());

    const finalBreakfast = shuffledBreakfast[0] || foodDatabase.find(i => i.category === 'Breakfast');
    const finalLunch = shuffledMainMeals[0] || foodDatabase.find(i => i.category === 'Meal');
    const finalDinner = shuffledMainMeals[1] || foodDatabase.find(i => i.name !== finalLunch?.name && i.category === 'Meal');
    const finalSnack = shuffledSnacks[0] || foodDatabase.find(i => i.category === 'Snack');

    setMealPlan({
      breakfast: finalBreakfast || null,
      lunch: finalLunch || null,
      dinner: finalDinner || null,
      snack: finalSnack || null
    });

    setShowPlanModal(false);
  }

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 safe-top">
      <div className="max-w-md mx-auto space-y-5">
        <div className="flex items-center justify-between animate-fade-in-down">
          <div>
            <p className="text-white/40 text-sm">{getGreeting()}</p>
            <h1 className="font-display text-2xl font-bold text-white mt-0.5">
              Welcome, <span className="text-white font-bold">{user?.firstName}</span>!
            </h1>
          </div>
          <TrialStatusBadge />
          <NotificationCenter />
          {user?.avatar || user?.profilePicture ? (
            <img
              src={user.avatar ?? user.profilePicture ?? undefined}
              alt={`${user?.firstName ?? 'User'} avatar`}
              className="h-12 w-12 rounded-2xl object-cover border border-white/10"
            />
          ) : (
            <DefaultAvatar gender={appMode} size="sm" />
          )}
        </div>

        {appMode === 'female' && <CycleTracker />}

        <StreakLeaderboard />

        <MetricTrends />

        <GlassPanel className="p-5 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-neon-cyan" />
              <span className="text-sm font-semibold text-white">Health Stats</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHealthDataImporter(true)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:text-white"
              >
                Sync
              </button>
              <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase bg-white/[0.06] text-neon-green">
                {bmiStatus}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-white/40">BMI</span>
                <span className={`text-[10px] uppercase ${getBmiPillClasses(bmiStatus)}`}>{bmiStatus}</span>
              </div>
              <div className="mt-3 text-3xl font-display font-bold text-white">{bmi.toFixed(1)}</div>
              <div className={`mt-2 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${getBmiPillClasses(bmiStatus)}`}>
                {getBmiCategory(bmi)}
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase text-white/40">Weight</span>
                <span className="text-[10px] uppercase text-neon-blue">{currentWeight} kg</span>
              </div>
              <div className="mt-3 h-16 flex items-end gap-1">
                {[40, 60, 75, 84, 62, 58, 90].map((v, i) => (
                  <div key={i} className="flex-1 rounded-full bg-white/[0.08] border border-white/[0.05]" style={{ height: `${22 + v / 8}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <div className="grid grid-cols-2 gap-3"><NumberStepper label="Height / الطول" value={bmiHeight || 0} min={50} max={250} unit="cm" onChange={setBmiHeight} /><NumberStepper label="Weight / الوزن" value={bmiWeight || 0} min={20} max={300} unit="kg" onChange={setBmiWeight} /></div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-pink-400/20 bg-pink-500/5 p-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/50">Category</div>
                <div className={`mt-1 text-sm font-bold ${bmiStatus === 'Normal' ? 'text-neon-green' : bmiStatus === 'Overweight' ? 'text-yellow-300' : bmiStatus === 'Obesity' ? 'text-red-300' : 'text-yellow-200'}`}>
                  {getBmiCategory(bmi)}
                </div>
              </div>
              <button className="glass-card px-3 py-2 text-[10px] font-bold uppercase rounded-xl text-neon-cyan" onClick={logCurrentWeight}>Log Weight</button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] uppercase text-white/40">Weight Progress</span>
            <button className="glass-card px-3 py-2 text-[10px] font-bold uppercase rounded-xl text-neon-cyan" onClick={logCurrentWeight}>Log Current Weight</button>
          </div>
          <div className="mt-2">
            <ProgressBar value={Math.min(100, Math.max(20, currentWeight * 2))} max={180} color="neon-cyan" height="h-2" />
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-neon-orange" />
              <span className="text-sm font-semibold text-white">Consistency Streak</span>
            </div>
            <div className="flex items-center gap-2 text-right">
              <span className="text-xs uppercase text-white/40">{streakDays} Days Streak</span>
              <span className={`rounded-full border px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${isOffline ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border-neon-green/30 bg-neon-green/10 text-neon-green'}`}>
                {isOffline ? 'Offline' : 'Synced'}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center">
                <Flame size={25} className="text-neon-orange" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-white">{streakDays} Days</div>
                <div className="text-[11px] uppercase text-white/40">Streak</div>
              </div>
            </div>
            <button className="glass-card px-4 py-2 rounded-2xl text-xs font-semibold text-neon-green" onClick={markTodayCompleted}>Mark Today as Completed</button>
          </div>
          <div className="mt-4 rounded-2xl border border-neon-orange/20 bg-neon-orange/5 p-3">
            <div className="text-sm font-semibold text-white">عاش! ماشي بقالك {streakDays} أيام استمرار 🔥</div>
            <div className="mt-1 text-[11px] text-white/50">{points} نقطة • {badges.length} شارات مكتسبة</div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 animate-fade-in-up border-neon-blue/25">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Droplets size={19} className="text-neon-blue" />
              <div>
                <span className="text-sm font-semibold text-white">متتبع شرب الماية</span>
                <p className="mt-1 text-[11px] text-white/45">هدفك حوالي {Math.round((dailyStats.waterGoal * 250) / 1000 * 10) / 10} لتر • محسوب على وزنك</p>
              </div>
            </div>
            <span className="text-sm font-bold text-neon-blue">{Math.round(dailyStats.waterConsumed * 250)} / {dailyStats.waterGoal * 250} ml</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan transition-all" style={{ width: `${Math.min(100, (dailyStats.waterConsumed / Math.max(dailyStats.waterGoal, 1)) * 100)}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-6 gap-1.5">
            {Array.from({ length: Math.min(12, Math.max(8, Math.ceil(dailyStats.waterGoal))) }, (_, index) => (
              <span key={index} className={`flex h-8 items-center justify-center rounded-xl border text-xs transition ${index < Math.floor(dailyStats.waterConsumed) ? 'border-neon-blue/50 bg-neon-blue/20 text-neon-blue' : 'border-white/10 bg-white/[0.03] text-white/25'}`} aria-label={`كوباية ${index + 1}`}>
                💧
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[250, 500, 750].map((amount) => (
              <button key={amount} type="button" onClick={() => addWater(amount)} className="rounded-2xl border border-neon-blue/20 bg-neon-blue/10 px-2 py-3 text-xs font-bold text-neon-blue transition hover:bg-neon-blue/20">
                +{amount} ml
              </button>
            ))}
          </div>
          <button type="button" onClick={() => addWater(250)} className="mt-2 w-full rounded-2xl bg-gradient-to-r from-neon-blue to-neon-cyan px-4 py-3 text-xs font-black text-ink-900 transition hover:brightness-110">+1 Cup (أضف كوباية 💧)</button>
          {waterNotice && <div className="mt-3 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-center text-xs text-neon-cyan">{waterNotice}</div>}
        </GlassPanel>

        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-neon-cyan" />
              <span className="text-sm font-semibold text-white">Reminders</span>
            </div>
            <button className="glass-card px-3 py-2 rounded-xl text-[10px] font-bold uppercase text-neon-cyan" onClick={requestNotificationPermission}>Enable</button>
          </div>
          <div className="mt-4 space-y-2">
            {Object.values(reminders).map((r) => (
              <div key={r.id} className="glass-card p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button className="rounded-full border border-white/15 p-2" onClick={() => toggleReminder(r.id)}>
                    {r.enabled ? <Check size={14} className="text-neon-green" /> : <X size={14} className="text-white/50" />}
                  </button>
                  <div>
                    <div className="text-[11px] uppercase text-white/50">{r.label}</div>
                    <input type="time" value={r.time} className="mt-1 bg-transparent text-white outline-none" onChange={(event) => updateReminderTime(r.id, event.target.value)} />
                  </div>
                </div>
                <button className="p-2 rounded-xl glass-card" onClick={() => sendReminderNotification(r.label, r.time)}>
                  <Bell size={15} className="text-neon-cyan" />
                </button>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparkIcon size={18} className="text-neon-orange" />
              <span className="text-sm font-semibold text-white">AI Meal Plan</span>
            </div>
            <button className="glass-card px-4 py-2 rounded-2xl text-[11px] font-bold uppercase text-neon-cyan" onClick={() => setShowPlanModal(true)}>Generate Custom Meal Plan</button>
          </div>
          {mealPlan && (
            <div className="mt-4 space-y-2">
              {([
                ['Breakfast', 'breakfast'],
                ['Lunch', 'lunch'],
                ['Dinner', 'dinner'],
                ['Snack', 'snack'],
              ] as Array<[MealSlot, keyof MealPlan]>).map(([slot, key]) => (
                <div key={slot} className="glass-card p-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs uppercase">{slot}</span>
                    <span className="text-[11px] text-neon-green">{mealPlan[key]?.name ?? 'No match'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel className="p-6 flex flex-col items-center animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-neon-orange" />
            <span className="text-sm font-medium text-white/60">Daily Calories</span>
          </div>
          <CircularProgress
            value={dailyStats.caloriesConsumed}
            max={targetCalories}
            size={200}
            label="Consumed"
            sublabel=" kcal"
            unit=""
          />
          <div className="flex items-center gap-6 mt-5">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-white">{dailyStats.caloriesConsumed}</p>
              <p className="text-xs text-white/40">eaten</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-neon-orange">{remaining}</p>
              <p className="text-xs text-white/40">remaining</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-neon-cyan">{targetCalories}</p>
              <p className="text-xs text-white/40">goal</p>
            </div>
          </div>
        </GlassPanel>

        <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
          <MacroMini label="Protein" value={dailyStats.proteinConsumed} goal={dailyStats.proteinGoal} color="neon-green" unit="g" />
          <MacroMini label="Carbs" value={dailyStats.carbsConsumed} goal={dailyStats.carbsGoal} color="neon-blue" unit="g" />
          <MacroMini label="Fat" value={dailyStats.fatConsumed} goal={dailyStats.fatGoal} color="neon-orange" unit="g" />
        </div>

        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">Nutrition Guide</p>
              <h3 className="font-display text-xl font-bold text-white mt-1">Diet & Meals</h3>
            </div>
            <button type="button" onClick={() => setScreen('diet')} className="flex items-center gap-2 rounded-2xl glass-card px-4 py-2 text-sm font-semibold text-neon-cyan hover:bg-white/[0.08] transition-all">
              Open<ArrowRight size={16} />
            </button>
          </div>
        </GlassPanel>

        <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-neon-blue/10 flex items-center justify-center">
                <Droplets size={18} className="text-neon-blue" />
              </div>
              <span className="text-xs font-medium text-white/50">Water</span>
            </div>
            <p className="text-xl font-display font-bold text-white">{dailyStats.waterConsumed}<span className="text-sm text-white/30"> / {dailyStats.waterGoal} cups</span></p>
            <div className="mt-2">
              <ProgressBar value={dailyStats.waterConsumed} max={dailyStats.waterGoal} color="neon-blue" height="h-1.5" />
            </div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-neon-green/10 flex items-center justify-center">
                <Footprints size={18} className="text-neon-green" />
              </div>
              <span className="text-xs font-medium text-white/50">Steps</span>
            </div>
            <p className="text-xl font-display font-bold text-white">{dailyStats.steps.toLocaleString()}<span className="text-sm text-white/30"> / {dailyStats.stepsGoal.toLocaleString()}</span></p>
            <div className="mt-2">
              <ProgressBar value={dailyStats.steps} max={dailyStats.stepsGoal} color="neon-green" height="h-1.5" />
            </div>
          </GlassCard>
        </div>

        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-neon-cyan" />
            <span className="text-sm font-semibold text-white">Weekly Calories</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-24">
            {weeklyCaloriesData.map((d, i) => {
              const maxVal = Math.max(...weeklyCaloriesData.map(x => x.value));
              const heightPct = (d.value / maxVal) * 100;
              const isToday = i === weeklyCaloriesData.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div className="w-full rounded-lg transition-all duration-700 ease-out" style={{ height: `${heightPct}%`, background: isToday ? 'linear-gradient(180deg, #22F5D6, #4FA8FF)' : 'rgba(255,255,255,0.08)', boxShadow: isToday ? '0 0 16px rgba(34,245,214,0.3)' : 'none' }} />
                  </div>
                  <span className={`text-[10px] ${isToday ? 'text-neon-cyan font-semibold' : 'text-white/30'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <HealthDataImporter isOpen={showHealthDataImporter} onClose={() => setShowHealthDataImporter(false)} />

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div className="relative w-full max-w-lg">
            <GlassPanel className="relative overflow-hidden border-neon-cyan/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">AI Meal Planner</span>
                  <h3 className="font-display text-2xl font-bold text-white mt-2">Create Custom Plan</h3>
                </div>
                <button type="button" onClick={() => setShowPlanModal(false)} className="rounded-full p-2 text-white/70 hover:text-white transition-colors"><X size={18} /></button>
              </div>

              <div className="mt-5">
                <span className="text-[11px] uppercase text-neon-cyan/80">Target Goal</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['Cutting', 'Bulking', 'Maintenance'] as FoodGoal[]).map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      className={`rounded-full px-4 py-2 text-[11px] font-bold border transition-all duration-300 ${selectedGoal === goal ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-[0_0_18px_rgba(34,245,214,0.4)]' : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/30'}`}
                      onClick={() => setSelectedGoal(goal)}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[11px] uppercase text-neon-cyan/80">Budget</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['Low', 'Medium', 'High'] as FoodBudgetLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`rounded-full px-4 py-2 text-[11px] font-bold border transition-all duration-300 ${selectedBudget === level ? 'border-neon-green bg-neon-green/20 text-neon-green shadow-[0_0_18px_rgba(160,255,190,0.3)]' : 'border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/30'}`}
                      onClick={() => setSelectedBudget(level)}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[11px] uppercase text-neon-cyan/80">Preferences & Exclusions (التفضيلات)</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {([
                    { tag: 'Vegetarian' as FoodPreferenceTag, label: 'نباتي (Vegetarian)' },
                    { tag: 'No Fish' as FoodPreferenceTag, label: 'بدون أسماك (No Fish)' },
                    { tag: 'No Meat' as FoodPreferenceTag, label: 'بدون لحوم (No Meat)' },
                    { tag: 'No Dairy' as FoodPreferenceTag, label: 'بدون ألبان (No Dairy)' },
                  ]).map((pref) => {
                    const active = preferences.includes(pref.tag);
                    return (
                      <button
                        key={pref.tag}
                        type="button"
                        className={`rounded-full px-4 py-2 text-[11px] font-semibold border transition-all duration-300 ${active ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10 shadow-[0_0_16px_rgba(34,245,214,0.24)]' : 'border-white/10 text-white/55 hover:text-white hover:border-white/30 bg-white/[0.02]'}`}
                        onClick={() => {
                          if (active) setPreferences((prev) => prev.filter((x) => x !== pref.tag));
                          else setPreferences((prev) => [...prev, pref.tag]);
                        }}
                      >
                        {pref.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button type="button" className="flex-1 glass-card px-4 py-3 rounded-2xl text-white/70 hover:text-white" onClick={() => setShowPlanModal(false)}>Cancel</button>
                <button type="button" className="flex-1 bg-neon-cyan text-ink-900 px-4 py-3 rounded-2xl font-bold" onClick={buildPlan}>Generate</button>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}

function getBmiStatus(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obesity';
}

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 24.9) return 'Normal weight';
  if (bmi < 29.9) return 'Overweight';
  return 'Obesity';
}

function getBmiPillClasses(status: string) {
  if (status === 'Normal') return 'text-neon-green border border-neon-green/40 bg-neon-green/10';
  if (status === 'Overweight') return 'text-yellow-300 border border-yellow-400/40 bg-yellow-500/10';
  if (status === 'Obesity') return 'text-red-300 border border-red-400/40 bg-red-500/10';
  return 'text-yellow-200 border border-yellow-300/40 bg-yellow-500/10';
}

function normalizeGoal(goal: string) {
  return goal.charAt(0).toUpperCase() + goal.slice(1);
}

function tryNotify(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') new Notification(title, { body });
}

function SparkIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return <Flame size={size} className={className} />;
}

function MacroMini({ label, value, goal, color, unit }: { label: string; value: number; goal: number; color: string; unit: string }) {
  return (
    <GlassCard className="p-3.5">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-lg font-display font-bold text-white">
        {value}<span className="text-xs text-white/30">{unit}</span>
      </p>
      <div className="mt-1.5"><ProgressBar value={value} max={goal} color={color} height="h-1.5" /></div>
    </GlassCard>
  );
}

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
