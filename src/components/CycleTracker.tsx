import { useMemo, useState } from 'react';
import { Activity, HeartPulse, Flower2, Flame, Calendar, Dumbbell, Shield, Snowflake } from 'lucide-react';
import { GlassPanel } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';

type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';

const phaseTips: Record<CyclePhase, string> = {
  Menstrual: 'Low energy. Focus on stretching, light yoga, or deloading.',
  Follicular: 'Energy is rising. Great time for cardio and building stamina.',
  Ovulation: 'Peak energy! Perfect for lifting heavy and hitting PRs.',
  Luteal: 'Energy dropping. Focus on moderate strength training and recovery.',
};

export function CycleTracker() {
  const { theme, user, onboardingProfile, isStreakSaverActive, streakSaverDays, activateStreakSaver, clearStreakSaver, t } = useApp();
  const femaleMode = user?.gender === 'female' || onboardingProfile?.gender === 'female';
  const [lastPeriodStart, setLastPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [cycleLength, setCycleLength] = useState(28);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const cycleInfo = useMemo(() => {
    const start = new Date(lastPeriodStart);
    if (!lastPeriodStart || Number.isNaN(start.getTime())) {
      return { phase: 'Follicular' as CyclePhase, cycleDay: 1, nextPhase: 'Menstrual' as CyclePhase, eta: 0 };
    }

    const today = new Date();
    const diffDays = Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
    const cycleDay = diffDays % cycleLength + 1;

    let phase: CyclePhase = 'Menstrual';
    if (cycleDay >= 1 && cycleDay <= 5) phase = 'Menstrual';
    else if (cycleDay >= 6 && cycleDay <= 13) phase = 'Follicular';
    else if (cycleDay >= 14 && cycleDay <= 17) phase = 'Ovulation';
    else phase = 'Luteal';

    const remaining = cycleLength - (cycleDay % cycleLength);
    return { phase, cycleDay, nextPhase: phase === 'Menstrual' ? 'Follicular' : 'Menstrual', eta: remaining };
  }, [lastPeriodStart, cycleLength]);

  const phaseMotion = femaleMode || theme === 'light'
    ? 'bg-pink-500/10 backdrop-blur-md border border-pink-500/30 shadow-[0_4px_30px_rgba(236,72,153,0.15)]'
    : 'bg-white/[0.04] border border-white/[0.06]';

  return (
    femaleMode ? (
    <GlassPanel className={`p-4 animate-fade-in-up ${phaseMotion}`}> 
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flower2 size={18} className={femaleMode ? 'text-pink-400' : 'text-neon-cyan'} />
          <span className="text-sm font-semibold text-white">{t('Cycle Tracker')}</span>
        </div>
        <span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-[10px] font-bold uppercase text-pink-200">
          {cycleInfo.phase}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-white/50">{t('Last Period Start')}</span>
          <input
            type="date"
            value={lastPeriodStart}
            onChange={(event) => setLastPeriodStart(event.target.value)}
            className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-pink-400`}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-white/50">{t('Cycle Length')}</span>
          <input
            type="number"
            min="20"
            max="45"
            value={cycleLength}
            onChange={(event) => setCycleLength(Math.min(45, Math.max(20, Number(event.target.value) || 28)))}
            className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-pink-400`}
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><Calendar size={11} /> Day</div>
          <div className="mt-1 text-sm font-bold text-white">{cycleInfo.cycleDay}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><Activity size={11} /> Phase</div>
          <div className="mt-1 text-[11px] font-bold text-pink-300">{cycleInfo.phase}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><Dumbbell size={11} /> Plan</div>
          <div className="mt-1 text-[11px] font-bold text-neon-cyan">{cycleInfo.nextPhase}</div>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/50"><Flame size={11} /> Tip</div>
          <div className="mt-1 text-[11px] font-bold text-neon-green">{cycleInfo.eta}d</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-pink-400/20 bg-pink-500/5 p-3">
        <div className="flex items-center gap-2">
          <HeartPulse size={14} className={femaleMode ? 'text-pink-400 animate-pulse' : 'text-neon-cyan'} />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">{t('Fitness Tip')}</span>
        </div>
        <p className="mt-2 text-[12px] leading-5 text-white/70">{phaseTips[cycleInfo.phase]}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-pink-500/30 bg-pink-500/10 p-3 backdrop-blur-md">
        {!isStreakSaverActive ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowDurationPicker((value) => !value)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(236,72,153,0.35)] transition hover:scale-[1.01]"
            >
              <Shield size={16} />
              {t('Activate Streak Saver')}
            </button>

            {showDurationPicker && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-pink-200/80">{t('Pause duration')}</p>
                <div className="grid grid-cols-5 gap-2">
                  {[3, 4, 5, 6, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        activateStreakSaver(days);
                        setShowDurationPicker(false);
                      }}
                      className="rounded-xl border border-pink-400/30 bg-white/5 px-2 py-2 text-xs font-semibold text-pink-100 transition hover:border-pink-300 hover:bg-pink-400/10"
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-pink-400/30 bg-pink-500/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <Snowflake size={15} className="text-pink-300" />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-pink-100">{t('Streak Saver Active')}</span>
              </div>
              <span className="rounded-full border border-pink-300/40 bg-white/5 px-2 py-1 text-[10px] font-bold text-pink-100">
                {streakSaverDays} days
              </span>
            </div>

            <p className="text-[12px] leading-5 text-pink-100/85">
              Take your time to rest! Your workout streak is protected for the next {streakSaverDays} day{streakSaverDays === 1 ? '' : 's'}.
            </p>

            <button
              type="button"
              onClick={clearStreakSaver}
              className="w-full rounded-xl border border-pink-400/30 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-pink-100 transition hover:bg-pink-500/10"
            >
              {t('Deactivate Streak Saver')}
            </button>
          </div>
        )}
      </div>
    </GlassPanel>
    ) : null
  );
}
