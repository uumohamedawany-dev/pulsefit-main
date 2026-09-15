import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { GlassCard, GlassPanel } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';
import { foodDatabase, type FoodCategory, type FoodGoal, type FoodItem, type FoodPreferenceTag } from '@/data/foodDatabase';
import { getWorkoutDatabase } from '@/data/workoutDatabase';
import type { MacroGoal, OnboardingProfile } from '@/types';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const workoutOrder: Array<keyof ReturnType<typeof getWorkoutDatabase>> = ['Legs', 'Chest', 'Back', 'Shoulders', 'Abs', 'Arms'];

export function PlansScreen() {
  const { setScreen, onboardingProfile, setOnboardingProfile, dailyStats, streakDays, appMode } = useApp();
  const [selectedGoal, setSelectedGoal] = useState<MacroGoal>(onboardingProfile?.goal ?? 'maintenance');
  const [selectedBudget, setSelectedBudget] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [preferences, setPreferences] = useState<FoodPreferenceTag[]>(['High Protein']);

  useEffect(() => {
    setSelectedGoal(onboardingProfile?.goal ?? 'maintenance');
  }, [onboardingProfile?.goal]);

  const mealCatalog = useMemo(() => {
    const filtered = foodDatabase.filter((item) => {
      if (preferences.includes('Vegetarian')) {
        const containsMeat = item.name.toLowerCase().includes('lamb') || item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('beef') || item.name.toLowerCase().includes('meat') || item.name.toLowerCase().includes('pasta') || item.name.toLowerCase().includes('shawarma');
        if (containsMeat) {
          return false;
        }
      }

      if (preferences.includes('No Fish')) {
        const containsFish = item.name.toLowerCase().includes('fish') || item.name.toLowerCase().includes('bolti') || item.name.toLowerCase().includes('tuna');
        if (containsFish) {
          return false;
        }
      }

      if (preferences.includes('No Meat')) {
        const containsMeat = item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('beef') || item.name.toLowerCase().includes('lamb') || item.name.toLowerCase().includes('meat') || item.name.toLowerCase().includes('shawarma') || item.name.toLowerCase().includes('kebab');
        if (containsMeat) {
          return false;
        }
      }

      if (preferences.includes('No Dairy')) {
        const containsDairy = item.name.toLowerCase().includes('cheese') || item.name.toLowerCase().includes('milk') || item.name.toLowerCase().includes('yogurt');
        if (containsDairy) {
          return false;
        }
      }

      return true;
    });

    return {
      Breakfast: filtered.filter((item) => item.category === 'Breakfast'),
      Meal: filtered.filter((item) => item.category === 'Meal'),
      Snack: filtered.filter((item) => item.category === 'Snack'),
      Vegetables: filtered.filter((item) => item.category === 'Vegetables'),
      Fruits: filtered.filter((item) => item.category === 'Fruits'),
      Carb: filtered.filter((item) => item.category === 'Carb'),
      Protein: filtered.filter((item) => item.category === 'Protein'),
    };
  }, [preferences]);

  const workDatabase = useMemo(() => getWorkoutDatabase(appMode), [appMode]);

  const adaptiveNote = useMemo(() => {
    if (dailyStats.caloriesConsumed >= dailyStats.caloriesGoal * 0.9) {
      return 'مستواك اليوم قريب من الهدف، خلّيك على وجبة خفيفة في العشاء وركز على البروتين.';
    }

    if (dailyStats.caloriesConsumed < dailyStats.caloriesGoal * 0.65) {
      return 'النتيجة لسه منخفضة شوية، خليك على وجبة متوازنة مع الكربوهيدرات والبروتين.';
    }

    return 'الـ plan الحالي متوازن وبيتكيف مع تقدمك اليومي بشكل ذكي.';
  }, [dailyStats.caloriesConsumed, dailyStats.caloriesGoal]);

  const weekPlan = useMemo(() => {
    const pickItem = (category: FoodCategory, offset: number) => {
      const pool = mealCatalog[category] ?? [];
      if (pool.length === 0) {
        return foodDatabase[0];
      }

      return pool[offset % pool.length] ?? pool[0];
    };

    return weekDays.map((day, index) => {
      const workoutKey = workoutOrder[index % workoutOrder.length];
      const workoutList = workDatabase[workoutKey] ?? [];
      const workoutName = workoutList[0]?.name ?? 'Full Body Cardio';
      const workoutHint = workoutList.slice(0, 3).map((entry) => entry.name).join(' • ');

      return {
        dayLabel: day,
        breakfast: pickItem('Breakfast', index + 1),
        lunch: pickItem('Meal', index + 2),
        dinner: pickItem('Meal', index + 3),
        snack: pickItem('Snack', index + 4),
        workoutKey,
        workoutName,
        workoutHint,
      };
    });
  }, [mealCatalog, workDatabase]);

  const updateGoal = (goal: MacroGoal) => {
    setSelectedGoal(goal);

    if (onboardingProfile) {
      const nextProfile: OnboardingProfile = { ...onboardingProfile, goal };
      setOnboardingProfile(nextProfile);
    }
  };

  const togglePreference = (tag: FoodPreferenceTag) => {
    setPreferences((current) => (
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    ));
  };

  return (
    <div className="min-h-screen px-4 pb-28 pt-6 safe-top">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">PulseFit</span>
            <h1 className="mt-1 font-display text-3xl font-bold text-white">Plans</h1>
          </div>
          <button
            type="button"
            onClick={() => setScreen('dashboard')}
            className="glass-card rounded-2xl p-3 text-white/70 transition hover:text-neon-cyan"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-neon-cyan/80">Smart Adaptive Planner</span>
              <div className="mt-2 flex items-center gap-2">
                <Sparkles size={18} className="text-neon-green" />
                <span className="font-display text-2xl font-bold text-white">خطة ذكية</span>
              </div>
            </div>
            <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-right">
              <div className="text-[10px] uppercase text-white/50">Streak</div>
              <div className="mt-1 text-lg font-display font-bold text-neon-cyan">{streakDays}d</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <GlassCard className="p-3">
              <div className="text-[10px] uppercase text-white/45">Goal</div>
              <div className="mt-1 text-sm font-bold text-white">{selectedGoal}</div>
            </GlassCard>
            <GlassCard className="p-3">
              <div className="text-[10px] uppercase text-white/45">Budget</div>
              <div className="mt-1 text-sm font-bold text-white">{selectedBudget}</div>
            </GlassCard>
            <GlassCard className="p-3">
              <div className="text-[10px] uppercase text-white/45">Calories</div>
              <div className="mt-1 text-sm font-bold text-white">{dailyStats.caloriesGoal}</div>
            </GlassCard>
          </div>

          <div className="mt-4 rounded-2xl border border-neon-green/20 bg-neon-green/5 p-3 text-sm leading-6 text-neon-green/90">
            {adaptiveNote}
          </div>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-neon-cyan" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Customize Plan</span>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">Primary Goal</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['cutting', 'bulking', 'maintenance'] as MacroGoal[]).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => updateGoal(goal)}
                    className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                      selectedGoal === goal
                        ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan'
                        : 'border-white/10 bg-white/[0.03] text-white/60'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">Budget</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['Low', 'Medium', 'High'] as const).map((budget) => (
                  <button
                    key={budget}
                    type="button"
                    onClick={() => setSelectedBudget(budget)}
                    className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                      selectedBudget === budget
                        ? 'border-neon-green bg-neon-green/10 text-neon-green'
                        : 'border-white/10 bg-white/[0.03] text-white/60'
                    }`}
                  >
                    {budget}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">Preferences</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['Vegetarian', 'No Fish', 'No Meat', 'No Dairy', 'High Protein'] as FoodPreferenceTag[]).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => togglePreference(tag)}
                    className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                      preferences.includes(tag)
                        ? 'border-pink-400 bg-pink-500/10 text-pink-200'
                        : 'border-white/10 bg-white/[0.03] text-white/60'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="space-y-3">
          {weekPlan.map((entry, index) => (
            <GlassPanel key={`${entry.dayLabel}-${index}`} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-neon-cyan" />
                  <span className="text-sm font-semibold text-white">{entry.dayLabel}</span>
                </div>
                <div className="rounded-full border border-neon-orange/20 bg-neon-orange/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-neon-orange">
                  {entry.workoutKey}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {([
                  ['Breakfast', entry.breakfast],
                  ['Lunch', entry.lunch],
                  ['Dinner', entry.dinner],
                  ['Snack', entry.snack],
                ] as Array<[string, FoodItem]>).map(([slot, meal]) => (
                  <div key={`${entry.dayLabel}-${slot}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">{slot}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-neon-green">{meal.calories} kcal</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">{meal.name}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={15} className="text-neon-cyan" />
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">Workout</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-neon-cyan">{entry.workoutName}</span>
                </div>
                <div className="mt-2 text-sm leading-6 text-white/75">{entry.workoutHint}</div>
              </div>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="p-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-neon-orange" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/55">Progress Rewards</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <GlassCard className="p-3 text-center">
              <Flame size={16} className="mx-auto text-neon-orange" />
              <div className="mt-2 text-lg font-display font-bold text-white">{streakDays}</div>
              <div className="text-[10px] uppercase text-white/40">Days</div>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <CheckCircle2 size={16} className="mx-auto text-neon-green" />
              <div className="mt-2 text-lg font-display font-bold text-white">{Math.max(1, Math.round(streakDays / 2))}</div>
              <div className="text-[10px] uppercase text-white/40">Badges</div>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <Target size={16} className="mx-auto text-neon-cyan" />
              <div className="mt-2 text-lg font-display font-bold text-white">{dailyStats.steps}</div>
              <div className="text-[10px] uppercase text-white/40">Steps</div>
            </GlassCard>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
