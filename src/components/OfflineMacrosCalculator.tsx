import { useMemo } from 'react';
import { Activity, Beef, Droplets, Flame, Scale, Target } from 'lucide-react';
import { GlassPanel, GlassCard } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';
import { calculateOfflineMacros, goalFactors } from '@/lib/macros';
import type { ActivityLevel, Gender, MacroGoal, OnboardingProfile } from '@/types';
import { DarkSelect, NumberStepper } from '@/components/FormControls';

export interface OfflineMacrosInputs extends OnboardingProfile {}

export function OfflineMacrosCalculator() {
  const { onboardingProfile, setOnboardingProfile, updateDailyStats } = useApp();
  const form = onboardingProfile ?? {
    weight: 72,
    height: 176,
    age: 28,
    gender: 'male' as Gender,
    goal: 'maintenance' as MacroGoal,
    activityLevel: 'sedentary' as ActivityLevel,
  };

  const calculation = useMemo(() => calculateOfflineMacros(form), [form]);

  const updateField = <K extends keyof OfflineMacrosInputs>(key: K, value: OfflineMacrosInputs[K]) => {
    const next = { ...form, [key]: value };
    setOnboardingProfile(next);
  };

  return (
    <GlassPanel className="p-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-neon-cyan/10 flex items-center justify-center">
            <Flame size={18} className="text-neon-orange" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Offline Macros Calculator</span>
            <p className="text-xs text-white/40 mt-1">Mifflin-St Jeor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-card">
          <Activity size={16} className="text-neon-green" />
          <span className="text-[11px] uppercase text-white/60">{goalFactors[form.goal].label}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3"><NumberStepper label="Weight / الوزن" value={form.weight} min={1} max={300} unit="kg" onChange={(value) => updateField('weight', value)} /><NumberStepper label="Height / الطول" value={form.height} min={1} max={250} unit="cm" onChange={(value) => updateField('height', value)} /><NumberStepper label="Age / السن" value={form.age} min={10} max={90} unit="سنة" onChange={(value) => updateField('age', value)} /><DarkSelect label="Gender / النوع" value={form.gender} onChange={(value) => updateField('gender', value as Gender)} options={[{ value: 'male', label: 'Male / ولد' }, { value: 'female', label: 'Female / بنت' }]} /></div>

      <div className="mt-3">
        <span className="text-[11px] text-white/40">Goal</span>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(Object.keys(goalFactors) as MacroGoal[]).map((goal) => (
            <button
              key={goal}
              className={`py-2 rounded-2xl border text-xs font-semibold transition-all ${
                form.goal === goal
                  ? 'bg-neon-cyan text-ink-900 border-neon-cyan'
                  : 'glass-card text-white/70 border-white/[0.08] hover:bg-white/[0.08]'
              }`}
              onClick={() => updateField('goal', goal)}
            >
              {goalFactors[goal].label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block space-y-1">
        <span className="text-[11px] text-white/40">مستوى الحركة اليومي</span>
        <select className="glass-input w-full px-3 py-3 text-sm" value={form.activityLevel ?? 'sedentary'} onChange={(event) => updateField('activityLevel', event.target.value as ActivityLevel)}>
          <option value="sedentary">قليل الحركة</option>
          <option value="light">حركة خفيفة</option>
          <option value="moderate">متوسط</option>
          <option value="high">نشاط عالي</option>
          <option value="athlete">رياضي محترف</option>
        </select>
      </label>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MetricTile label="BMR" value={`${calculation.bmr} kcal`} icon={<Flame size={16} className="text-neon-orange" />} />
        <MetricTile label="TDEE" value={`${calculation.tdee} kcal`} icon={<Activity size={16} className="text-neon-cyan" />} />
        <MetricTile label="Daily" value={`${calculation.targetDailyCalories} kcal`} icon={<Target size={16} className="text-neon-green" />} />
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/80">Macro Split</span>
          <span className="text-[11px] text-white/40">40 / 35 / 25</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MacroTile label="Protein" value={`${calculation.macroBreakdown.protein}g`} color="neon-green" />
          <MacroTile label="Carbs" value={`${calculation.macroBreakdown.carbs}g`} color="neon-blue" />
          <MacroTile label="Fat" value={`${calculation.macroBreakdown.fat}g`} color="neon-pink" />
        </div>
      </div>

      <button
        type="button"
        onClick={() => updateDailyStats({
          caloriesGoal: calculation.targetDailyCalories,
          proteinGoal: calculation.macroBreakdown.protein,
          carbsGoal: calculation.macroBreakdown.carbs,
          fatGoal: calculation.macroBreakdown.fat,
        })}
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-[11px] font-black uppercase text-ink-900"
      >
        تطبيق كأهدافي اليومية
      </button>
    </GlassPanel>
  );
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon: JSX.Element }) {
  return (
    <GlassCard className="p-3 flex flex-col items-center justify-center">
      <div className="mb-2 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] text-white/40 uppercase">{label}</span>
      <span className="text-sm font-display font-bold text-white mt-1">{value}</span>
    </GlassCard>
  );
}

function MacroTile({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    'neon-green': 'text-neon-green',
    'neon-blue': 'text-neon-blue',
    'neon-pink': 'text-neon-pink',
  };

  return (
    <div className="text-center">
      <div className="w-8 h-8 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto">
        <Scale size={16} className={colorMap[color]} />
      </div>
      <span className="text-[10px] text-white/40 block mt-2">{label}</span>
      <span className={`text-xs font-semibold ${colorMap[color]} mt-1 block`}>{value}</span>
    </div>
  );
}
