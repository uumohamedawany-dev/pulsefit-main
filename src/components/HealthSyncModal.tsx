import { useEffect, useState } from 'react';
import { Activity, Flame, Footprints, HeartPulse, MoonStar, Smartphone, Sparkles, Watch, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { DailyStats } from '@/types';

interface HealthSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createInitialForm = (stats: DailyStats) => ({
  steps: stats.steps,
  heartRateResting: stats.heartRateResting,
  heartRatePeak: stats.heartRatePeak,
  activeCalories: stats.activeCalories,
  sleepHours: stats.sleepHours,
  sleepMinutes: stats.sleepMinutes,
  waterConsumed: stats.waterConsumed,
});

const samsungHealthSample = {
  steps: 8612,
  heartRateResting: 68,
  heartRatePeak: 148,
  activeCalories: 390,
  sleepHours: 6,
  sleepMinutes: 45,
  waterConsumed: 6,
};

const weoflyFitSample = {
  steps: 10240,
  heartRateResting: 65,
  heartRatePeak: 152,
  activeCalories: 510,
  sleepHours: 7,
  sleepMinutes: 15,
  waterConsumed: 7,
};

export function HealthSyncModal({ isOpen, onClose }: HealthSyncModalProps) {
  const { appMode, dailyStats, updateDailyStats } = useApp();
  const isFemale = appMode === 'female';
  const accentClasses = isFemale
    ? {
        text: 'text-pink-400',
        progress: 'from-pink-500 to-rose-500',
        border: 'border-pink-400/30',
        button: 'border-pink-400/40 bg-pink-500/10 text-pink-100',
        chip: 'border-pink-400/30 bg-pink-500/10 text-pink-200',
      }
    : {
        text: 'text-cyan-400',
        progress: 'from-cyan-500 to-blue-500',
        border: 'border-cyan-400/30',
        button: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100',
        chip: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200',
      };

  const [form, setForm] = useState(createInitialForm(dailyStats));
  const [syncSource, setSyncSource] = useState('Manual');

  useEffect(() => {
    if (isOpen) {
      setForm(createInitialForm(dailyStats));
      setSyncSource('Manual');
    }
  }, [isOpen, dailyStats]);

  if (!isOpen) return null;

  const updateField = (field: keyof typeof form, value: string | number) => {
    setForm((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const applySync = (source: 'Samsung Health' | 'Weofly Fit') => {
    const sample = source === 'Samsung Health' ? samsungHealthSample : weoflyFitSample;
    setForm((current) => ({ ...current, ...sample }));
    setSyncSource(source);
  };

  const handleSave = () => {
    updateDailyStats({
      ...dailyStats,
      steps: form.steps,
      heartRateResting: form.heartRateResting,
      heartRatePeak: form.heartRatePeak,
      activeCalories: form.activeCalories,
      sleepHours: form.sleepHours,
      sleepMinutes: form.sleepMinutes,
      waterConsumed: form.waterConsumed,
    });
    onClose();
  };

  const stepsProgress = Math.min((form.steps / Math.max(dailyStats.stepsGoal, 1)) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl">
        <div className="rounded-[28px] border border-white/10 bg-zinc-950/80 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`text-[11px] uppercase tracking-[0.18em] ${accentClasses.text}`}>Smart Sync</span>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">Manual Health Data</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => applySync('Samsung Health')}
              className={`rounded-2xl border p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.03] ${accentClasses.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05]">
                    <Smartphone size={18} className={accentClasses.text} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Connected</div>
                    <div className="text-sm font-bold text-white">Samsung Health</div>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${accentClasses.chip}`}>
                  Sync Now
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applySync('Weofly Fit')}
              className={`rounded-2xl border p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.03] ${accentClasses.border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05]">
                    <Watch size={18} className={accentClasses.text} />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-white/40">Wearable</div>
                    <div className="text-sm font-bold text-white">Weofly Fit</div>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${accentClasses.chip}`}>
                  Sync Now
                </span>
              </div>
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={accentClasses.text} />
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">Sync Status</span>
              </div>
              <span className="text-[10px] font-semibold uppercase text-white/40">{syncSource}</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                  <span className="flex items-center gap-2"><Footprints size={13} className={accentClasses.text} />Steps</span>
                  <span className="text-white">{form.steps.toLocaleString()} / {dailyStats.stepsGoal.toLocaleString()}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${accentClasses.progress}`}
                    style={{ width: `${stepsProgress}%` }}
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  onChange={(event) => updateField('steps', event.target.value)}
                  value={form.steps}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-pink-400"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                    <HeartPulse size={13} className={accentClasses.text} />Heart Rate
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                      Resting
                      <input
                        type="number"
                        min="0"
                        value={form.heartRateResting}
                        onChange={(event) => updateField('heartRateResting', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none focus:border-pink-400"
                      />
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                      Peak
                      <input
                        type="number"
                        min="0"
                        value={form.heartRatePeak}
                        onChange={(event) => updateField('heartRatePeak', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none focus:border-pink-400"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                    <Flame size={13} className={accentClasses.text} />Active Burn
                  </div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Calories
                    <input
                      type="number"
                      min="0"
                      value={form.activeCalories}
                      onChange={(event) => updateField('activeCalories', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none focus:border-pink-400"
                    />
                  </label>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                    <MoonStar size={13} className={accentClasses.text} />Sleep
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                      Hours
                      <input
                        type="number"
                        min="0"
                        value={form.sleepHours}
                        onChange={(event) => updateField('sleepHours', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none focus:border-pink-400"
                      />
                    </label>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                      Minutes
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={form.sleepMinutes}
                        onChange={(event) => updateField('sleepMinutes', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none focus:border-pink-400"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                    <Activity size={13} className={accentClasses.text} />Water
                  </div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                    Intake (cups)
                    <input
                      type="number"
                      min="0"
                      value={form.waterConsumed}
                      onChange={(event) => updateField('waterConsumed', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-sm text-white outline-none focus:border-pink-400"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${accentClasses.button}`}
            >
              Save Health Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
