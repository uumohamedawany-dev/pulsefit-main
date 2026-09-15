import { Download, Cloud, Check, Plus, Sunrise, Salad, CupSoda, Fish, Flame } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { GlassPanel, GlassCard, ToggleSwitch, ProgressBar } from '@/components/GlassUI';
import { OfflineMacrosCalculator } from '@/components/OfflineMacrosCalculator';
import { meals, dailyStats } from '@/data/mockData';
import { useState } from 'react';
import { ProGate } from '@/components/ProGate';

const mealIcons: Record<string, typeof Sunrise> = {
  sunrise: Sunrise,
  salad: Salad,
  'cup-soda': CupSoda,
  fish: Fish,
};

export function DietScreen() {
  const { offlineMacros, setOfflineMacros } = useApp();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const handleToggleOffline = (enabled: boolean) => {
    if (enabled && !offlineMacros) {
      setDownloadProgress(0);
      const interval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev === null) return null;
          if (prev >= 100) {
            clearInterval(interval);
            setOfflineMacros(true);
            setDownloadProgress(null);
            return null;
          }
          return prev + 10;
        });
      }, 200);
    } else {
      setOfflineMacros(enabled);
    }
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 safe-top">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="animate-fade-in-down">
          <h1 className="font-display text-2xl font-bold text-white">Diet & Meals</h1>
          <p className="text-white/40 text-sm mt-0.5">Track your nutrition and macros</p>
        </div>

        {/* Daily macro summary */}
        <GlassPanel className="p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">Today's Macros</span>
            <Flame size={18} className="text-neon-orange" />
          </div>
          <div className="space-y-3">
            <MacroBar label="Calories" value={dailyStats.caloriesConsumed} goal={dailyStats.caloriesGoal} color="neon-orange" unit=" kcal" />
            <MacroBar label="Protein" value={dailyStats.proteinConsumed} goal={dailyStats.proteinGoal} color="neon-green" unit="g" />
            <MacroBar label="Carbs" value={dailyStats.carbsConsumed} goal={dailyStats.carbsGoal} color="neon-blue" unit="g" />
            <MacroBar label="Fat" value={dailyStats.fatConsumed} goal={dailyStats.fatGoal} color="neon-pink" unit="g" />
          </div>
        </GlassPanel>

        {/* Offline Macros Database Toggle */}
        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              offlineMacros ? 'bg-neon-green/10' : 'bg-white/[0.05]'
            }`}>
              {downloadProgress !== null ? (
                <Download size={22} className="text-neon-cyan animate-bounce" />
              ) : offlineMacros ? (
                <Check size={22} className="text-neon-green" />
              ) : (
                <Cloud size={22} className="text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm">Offline Macros Calculator</h3>
              <p className="text-xs text-white/40 mt-1">
                {downloadProgress !== null
                  ? `Downloading database... ${downloadProgress}%`
                  : offlineMacros
                  ? 'Database downloaded. Calculate macros anywhere, even offline.'
                  : 'Download the full food database to calculate macros without internet.'}
              </p>
              {downloadProgress !== null && (
                <div className="mt-2">
                  <ProgressBar value={downloadProgress} max={100} color="neon-cyan" height="h-1.5" />
                </div>
              )}
            </div>
            <ToggleSwitch checked={offlineMacros || downloadProgress !== null} onChange={handleToggleOffline} activeColor="neon-cyan" />
          </div>
        </GlassPanel>

        <ProGate feature="حاسبة TDEE والماكروز الذكية"><OfflineMacrosCalculator /></ProGate>

        {/* Meal log */}
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-white">Meal Log</h2>
            <button className="flex items-center gap-1 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors">
              <Plus size={14} /> Add meal
            </button>
          </div>
          <div className="space-y-3">
            {meals.map((meal, i) => {
              const Icon = mealIcons[meal.icon] || Sunrise;
              return (
                <GlassCard
                  key={meal.id}
                  className="p-4 animate-slide-up"
                >
                  <div className="flex items-center gap-4" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      <Icon size={22} className="text-neon-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{meal.name}</h3>
                      <p className="text-xs text-white/30 mt-0.5">{meal.time}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-neon-orange font-medium">{meal.calories} kcal</span>
                        <span className="text-xs text-neon-green/70">{meal.protein}g protein</span>
                        <span className="text-xs text-neon-blue/70">{meal.carbs}g carbs</span>
                        <span className="text-xs text-neon-pink/70">{meal.fat}g fat</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Quick add floating button */}
        <button className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center neon-glow-cyan active:scale-90 transition-transform z-40">
          <Plus size={24} className="text-ink-900" />
        </button>
      </div>
    </div>
  );
}

function MacroBar({ label, value, goal, color, unit }: { label: string; value: number; goal: number; color: string; unit: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/50 font-medium">{label}</span>
        <span className="text-xs text-white/40 tabular-nums">
          {value}{unit} <span className="text-white/20">/ {goal}{unit}</span>
        </span>
      </div>
      <ProgressBar value={value} max={goal} color={color} height="h-2" />
    </div>
  );
}
