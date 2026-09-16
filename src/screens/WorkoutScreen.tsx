import { useEffect, useMemo, useState } from 'react';
import { X, Dumbbell, Home, Play, Activity, Target, Footprints, Crown, Calendar, Sparkles, Flame, HeartPulse } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { GlassPanel } from '@/components/GlassUI';
import { getWorkoutDatabase } from '@/data/workoutDatabase';
import { generateWorkoutSplit, getGoalOptions, getSplitOptions, suggestSplitByGoalAndDays, type ScheduleDay, type SplitSystem, type WorkoutGoal } from '@/data/splitGenerator';
import { splitPickerLabel } from '@/data/programHeroes';
import type { WorkoutCategory, WorkoutExercise } from '@/types';
import { safeReadStorage, safeWriteStorage } from '@/lib/permissions';

function ProgramHeroCard({ splitSystem, appMode }: { splitSystem: SplitSystem; appMode: 'male' | 'female' }) {
  const isFemale = appMode === 'female';

  return (
    <div className={`relative mt-3 min-h-[168px] overflow-hidden rounded-3xl border ${isFemale ? 'border-pink-500/20 bg-gradient-to-br from-pink-950/30 via-rose-950/20 to-black shadow-[0_8px_32px_0_rgba(236,72,153,0.15)]' : 'border-cyan-500/20 bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-black shadow-[0_8px_32px_0_rgba(6,182,212,0.1)]'} backdrop-blur-xl`}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      <div className="relative z-10 flex h-full min-h-[168px] flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neon-cyan backdrop-blur-md">
            {splitPickerLabel[splitSystem]}
          </span>
          <Sparkles className="text-neon-cyan" size={16} />
        </div>
        <div className="max-w-[88%] rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
          <div className="font-display text-lg font-bold text-white">
            {splitPickerLabel[splitSystem]} Flow
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neon-cyan">
            Smart Schedule
          </div>
          <div className="mt-2 text-[11px] leading-relaxed text-white">
            {splitPickerLabel[splitSystem]} training rhythm by design.
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseDemoVisual({ exercise }: { exercise: WorkoutExercise }) {
  const demoTips = exercise.tips && exercise.tips.length > 0 ? exercise.tips : [
    'Keep your posture clean and controlled.',
    'Move through the full range of motion.',
    'Brace your core and breathe with the set.',
  ];

  return (
    <div className="relative flex h-56 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(34,245,214,0.16),rgba(6,7,11,0.95))]">
      <Dumbbell size={44} className="text-neon-cyan" />
      <div className="flex max-w-[90%] flex-col items-center gap-2 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-neon-cyan">{exercise.name}</p>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Demo Coaching</p>
          <ul className="mt-2 space-y-1 text-center text-[10px] font-medium text-white/80">
            {demoTips.slice(0, 3).map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const categoryLabel: Record<WorkoutCategory, string> = {
  Chest: 'Chest (الصدر)',
  Back: 'Back (الظهر)',
  Legs: 'Legs (الرجلين)',
  Shoulders: 'Shoulders (الكتف)',
  Arms: 'Arms (الذراع)',
  Abs: 'Abs (البطن)',
};

const categoryIcon: Record<WorkoutCategory, typeof Activity> = {
  Chest: Activity,
  Back: Dumbbell,
  Legs: Footprints,
  Shoulders: Target,
  Arms: Activity,
  Abs: Crown,
};

export function WorkoutScreen() {
  const { user, workoutType, setWorkoutType, appMode, completeWorkout, submitWorkoutCheckIn, saveExercisePr } = useApp();
  const [completionNotice, setCompletionNotice] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInNotice, setCheckInNotice] = useState('');
  const [lastCheckInAt, setLastCheckInAt] = useState(() => safeReadStorage('pulsefit.lastWorkoutCheckInAt'));
  const [prValues, setPrValues] = useState<Record<string, string>>({});
  const [selectedCategories, setSelectedCategories] = useState<WorkoutCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoExercise, setDemoExercise] = useState<WorkoutExercise | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [splitSystem, setSplitSystem] = useState<SplitSystem>('PPL');
  const [goal, setGoal] = useState<WorkoutGoal>('Bulking');
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);

  const splitOptions = getSplitOptions(appMode);
  const goalOptions = getGoalOptions(appMode);
  const exerciseMode = workoutType === 'gym' ? 'Gym' : 'Home';
  const isFemale = appMode === 'female';
  const activeToggleClasses = isFemale
    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30';

  useEffect(() => {
    setGoal((currentGoal) => (goalOptions.includes(currentGoal) ? currentGoal : goalOptions[0]));
    setSplitSystem((currentSplit) => (splitOptions.includes(currentSplit) ? currentSplit : splitOptions[0]));
  }, [goalOptions, splitOptions]);

  useEffect(() => {
    setSchedule(generateWorkoutSplit(splitSystem));
  }, [splitSystem]);

  const filteredExercises = useMemo<WorkoutExercise[]>(() => {
    if (!selectedCategories.length) return [];
    const workoutCatalog = getWorkoutDatabase(appMode);
    return selectedCategories.flatMap((category) =>
      workoutCatalog[category].filter((item) => item.type === exerciseMode)
    );
  }, [selectedCategories, exerciseMode, appMode]);

  const chooseCategory = (category: WorkoutCategory) => {
    setSelectedCategories([category]);
    setShowModal(true);
  };

  const recommendSplit = () => {
    const nextSystem = suggestSplitByGoalAndDays(daysPerWeek, goal, appMode);
    setSplitSystem(nextSystem);
    setSchedule(generateWorkoutSplit(nextSystem));
  };

  const selectSplit = (system: SplitSystem) => {
    if (!splitOptions.includes(system)) return;
    setSplitSystem(system);
    setSchedule(generateWorkoutSplit(system));
  };

  const chooseScheduleDay = (day: ScheduleDay) => {
    if (!day.categories.length) return;
    setSelectedCategories(day.categories);
    setShowModal(true);
  };

  const openExerciseDemo = (exercise: WorkoutExercise) => {
    setDemoExercise(exercise);
    setShowDemoModal(true);
  };

  const finishWorkout = () => {
    completeWorkout();
    setCompletionNotice('عاش يا وحش! التمرين اتحسب وزودنا نقاطك 🔥');
    window.setTimeout(() => setCompletionNotice(''), 3000);
  };

  const checkInLocked = Boolean(lastCheckInAt && Date.now() - Date.parse(lastCheckInAt) < 24 * 60 * 60 * 1000);

  const submitCheckIn = async () => {
    if (checkInLocked) {
      setCheckInNotice('سجلت تمرينة قريب، استنى لحد ما يعدّي 24 ساعة يا وحش.');
      return;
    }
    const response = await submitWorkoutCheckIn(checkInNote);
    setCheckInNotice(response.message || (response.success ? 'اتسجلت تمرينتك بنجاح.' : 'تعذر تسجيل التمرينة.'));
    if (response.success) {
      const now = new Date().toISOString();
      setLastCheckInAt(now);
      safeWriteStorage('pulsefit.lastWorkoutCheckInAt', now);
      setCheckInNote('');
    }
  };

  const savePr = async (exerciseName: string) => {
    const value = prValues[exerciseName]?.trim();
    if (!value) return;
    const response = await saveExercisePr(exerciseName, value);
    setCompletionNotice(response.message || (response.success ? 'تم حفظ الـ PR.' : 'تعذر حفظ الـ PR.'));
  };

  return (
    <div className="min-h-screen px-4 safe-content-bottom pt-6 safe-top">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">Training</span>
            <h1 className="font-display text-3xl font-bold text-white mt-1">Workouts</h1>
          </div>
          <button
            type="button"
            className="glass-card rounded-2xl p-3 text-white/70 hover:text-neon-cyan transition-all"
            onClick={() => setShowModal(false)}
          >
            <Dumbbell size={18} />
          </button>
        </div>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${workoutType === 'gym' ? activeToggleClasses : 'text-white/50 hover:text-white'}`}
                onClick={() => setWorkoutType('gym')}
              >
                <span className="flex items-center gap-2"><Dumbbell size={14} />Gym</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${workoutType === 'bodyweight' ? activeToggleClasses : 'text-white/50 hover:text-white'}`}
                onClick={() => setWorkoutType('bodyweight')}
              >
                <span className="flex items-center gap-2"><Home size={14} />Home</span>
              </button>
            </div>
            <span className="text-[11px] font-bold text-neon-red uppercase">{workoutType === 'gym' ? 'Gym Mode' : 'Home Mode'}</span>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-neon-cyan">
                <Sparkles size={14} />Generate My Program
              </div>
              <h2 className="font-display text-2xl mt-2 font-bold text-white">Program Generator</h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                <span>Days / Week</span>
                <span className="text-neon-cyan">{daysPerWeek} Days</span>
              </div>
              <input
                type="range"
                min="3"
                max="6"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full accent-neon-cyan"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                <span>Goal</span>
                <span className="text-neon-cyan">{goal}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {goalOptions.map((nextGoal) => (
                  <button
                    key={nextGoal}
                    type="button"
                    className={`rounded-2xl px-3 py-2 text-[11px] font-bold transition-all ${goal === nextGoal ? activeToggleClasses : 'glass-card text-white/70 hover:text-white'}`}
                    onClick={() => setGoal(nextGoal)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {nextGoal === 'Cutting' || nextGoal === 'Body Sculpting' ? <Flame size={12} /> : <HeartPulse size={12} />}
                      {nextGoal}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                <span>Direct Split Picker</span>
                <span className="text-neon-cyan">{splitPickerLabel[splitSystem]}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {splitOptions.map((system) => (
                  <button
                    key={system}
                    type="button"
                    className={`rounded-2xl px-3 py-2 text-[11px] font-bold transition-all ${splitSystem === system ? activeToggleClasses : 'glass-card text-white/70 hover:text-white'}`}
                    onClick={() => selectSplit(system)}
                  >
                    {splitPickerLabel[system]}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={recommendSplit}
              className="w-full rounded-2xl bg-neon-cyan px-4 py-3 text-[11px] font-black uppercase text-ink-900 shadow-[0_0_20px_rgba(89,230,218,0.25)] transition-all hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2"><Sparkles size={14} />Recommend Split</span>
            </button>
          </div>
        </GlassPanel>

        {schedule.length > 0 && (
          <GlassPanel className={`p-4 ${isFemale ? 'bg-gradient-to-br from-pink-950/30 via-rose-950/20 to-black backdrop-blur-xl border border-pink-500/20 shadow-[0_8px_32px_0_rgba(236,72,153,0.15)]' : 'bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-black backdrop-blur-xl border border-cyan-500/20 shadow-[0_8px_32px_0_rgba(6,182,212,0.1)]'}`}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-neon-red">
              <Calendar size={14} />Weekly Schedule
            </div>

            <ProgramHeroCard splitSystem={splitSystem} appMode={appMode} />

            <div className="mt-3 grid grid-cols-2 gap-2">
              {schedule.map((day) => (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => chooseScheduleDay(day)}
                  className={`rounded-2xl p-3 text-left transition-all ${isFemale ? 'bg-gradient-to-br from-pink-950/20 via-rose-950/10 to-black border border-pink-500/20 shadow-[0_8px_24px_0_rgba(236,72,153,0.12)] hover:border-pink-400/50 hover:shadow-[0_8px_24px_0_rgba(236,72,153,0.18)]' : 'bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-black border border-cyan-500/20 shadow-[0_8px_24px_0_rgba(6,182,212,0.08)] hover:border-cyan-400/50 hover:shadow-[0_8px_24px_0_rgba(6,182,212,0.14)]'} backdrop-blur-xl`}
                >
                  <div className="text-[10px] uppercase text-white/40">Day {day.day}</div>
                  <div className="font-display text-sm font-bold text-white mt-1">{day.label}</div>
                  <div className="mt-2 text-[10px] text-white/50">
                    {day.categories.length ? day.categories.map((category) => categoryLabel[category]).join(' • ') : 'Recovery / pump work'}
                  </div>
                </button>
              ))}
            </div>
          </GlassPanel>
        )}

        <GlassPanel className="border-neon-green/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-neon-green">Daily Completion</div>
              <div className="mt-1 text-sm font-semibold text-white">خلصت تمرين النهارده؟</div>
            </div>
            <button type="button" onClick={finishWorkout} className="rounded-2xl bg-neon-green px-4 py-3 text-[11px] font-bold text-ink-900">Complete Workout</button>
          </div>
          {completionNotice && <div className="mt-3 rounded-2xl border border-neon-green/20 bg-neon-green/10 px-3 py-2 text-xs text-neon-green">{completionNotice}</div>}
        </GlassPanel>

        <GlassPanel className="border-neon-cyan/25 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[11px] uppercase tracking-[0.16em] text-neon-cyan">Workout Journal</div><div className="mt-1 text-sm font-semibold text-white">سجل تمرينة النهاردة</div></div>
            <span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${checkInLocked ? 'border-white/10 text-white/45' : 'border-neon-green/30 text-neon-green'}`}>{checkInLocked ? 'تم التسجيل' : 'متاح دلوقتي'}</span>
          </div>
          <input value={checkInNote} onChange={(event) => setCheckInNote(event.target.value.replace(/[\r\n]/g, ' ').slice(0, 160))} disabled={checkInLocked} maxLength={160} placeholder="مثال: تمرين صدر قوي في الجيم اليوم" className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50" />
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[10px] text-white/35">{checkInNote.length}/160 • مرة كل 24 ساعة</span><button type="button" onClick={() => void submitCheckIn()} disabled={checkInLocked || !user?.email || checkInNote.trim().length < 3} className="rounded-2xl bg-neon-cyan px-4 py-2.5 text-[11px] font-bold text-ink-900 disabled:opacity-40">سجل التمرينة</button></div>
          {checkInNotice && <div className="mt-3 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-xs text-neon-cyan">{checkInNotice}</div>}
        </GlassPanel>

        <GlassPanel className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs'] as WorkoutCategory[]).map((category) => {
              const Icon = categoryIcon[category];
              const isActive = selectedCategories[0] === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => chooseCategory(category)}
                  className={`relative min-h-[130px] rounded-3xl border p-4 text-left transition-all duration-300 ${isActive ? 'border-red-500/70 bg-red-500/10 shadow-[0_0_18px_rgba(220,38,38,0.45)]' : 'border-red-500/30 bg-white/[0.03] hover:bg-red-950/20 hover:border-red-500/60'}`}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.12),transparent)] opacity-80" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="rounded-2xl glass-card p-2">
                        <Icon size={24} className="text-neon-red" />
                      </span>
                      <span className="text-[10px] uppercase text-white/40">{workoutType === 'gym' ? 'Gym' : 'Home'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] uppercase text-white/40">{category}</span>
                      <h3 className="font-display text-xl font-bold text-white mt-1">{categoryLabel[category]}</h3>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      {showModal && selectedCategories.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg">
            <GlassPanel className="relative max-h-[80vh] overflow-y-auto border-neon-cyan/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">Muscle Focus</span>
                  <h3 className="font-display text-2xl font-bold text-white mt-2">{selectedCategories.map((category) => categoryLabel[category]).join(' / ')}</h3>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="rounded-full p-2 text-white/70 hover:text-white transition-colors"><X size={18} /></button>
              </div>

              <div className="mt-4 space-y-2">
                {filteredExercises.length === 0 && (
                  <div className="glass-card p-3 rounded-2xl text-white/60 text-[11px] font-semibold">
                    No exercises found for this mapping in {workoutType === 'gym' ? 'Gym' : 'Home'} mode.
                  </div>
                )}

                {filteredExercises.map((item, index) => {
                  const instructions = item.instructions && item.instructions.length > 0 ? item.instructions : item.tips ?? [];

                  return (
                    <div key={`${item.name}-${index}`} className="glass-card p-3 rounded-2xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] uppercase text-neon-cyan">{item.name}</span>
                          <div className="text-[11px] text-white/50 mt-1">{item.sets} Sets • {item.reps} Reps • {item.rest} sec rest</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/60">{item.type}</span>
                          </div>
                        </div>
                        <button type="button" className="rounded-full border border-neon-cyan/50 px-3 py-1 text-[10px] font-bold text-neon-cyan hover:bg-neon-cyan hover:text-ink-900" onClick={() => openExerciseDemo(item)}>View Demo</button>
                      </div>

                      {instructions.length > 0 && (
                        <div className="mt-3 border-l-2 border-pink-500/50 pl-3">
                          <div className="text-[10px] uppercase tracking-[0.14em] text-pink-200/80">Exercise Instructions</div>
                          <div className="mt-2 space-y-1.5">
                            {instructions.map((instruction, instructionIndex) => (
                              <p key={`${instruction}-${instructionIndex}`} className="text-sm leading-relaxed text-pink-200/80">
                                {instruction}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/5 p-3">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-amber-200">سجل الـ PR الخاص بك</div>
                        <div className="mt-2 flex gap-2">
                          <input value={prValues[item.name] || ''} onChange={(event) => setPrValues((current) => ({ ...current, [item.name]: event.target.value.slice(0, 80) }))} onKeyDown={(event) => { if (event.key === 'Enter') void savePr(item.name); }} placeholder="مثال: 80kg × 8 أو 60 ثانية" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/30" />
                          <button type="button" onClick={() => void savePr(item.name)} className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-[10px] font-bold text-amber-100">حفظ</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-3">
                <button type="button" className="flex-1 glass-card px-4 py-3 rounded-2xl text-white/70 hover:text-white" onClick={() => setShowModal(false)}>Close</button>
                <button type="button" className="flex-1 bg-neon-cyan text-ink-900 px-4 py-3 rounded-2xl font-bold flex items-center justify-center gap-2" onClick={() => setShowModal(false)}>
                  <Play size={15} />Start Training
                </button>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {showDemoModal && demoExercise && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDemoModal(false)} />
          <div className="relative w-full max-w-2xl">
            <GlassPanel className="relative max-h-[88vh] overflow-y-auto border-neon-cyan/30 p-5">
              <button type="button" onClick={() => setShowDemoModal(false)} className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/70 hover:text-white transition-colors"><X size={18} /></button>
              <div className="pt-8">
                <ExerciseDemoVisual exercise={demoExercise} />

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.14em] text-neon-cyan">Exercise Demo</span>
                      <h3 className="font-display text-2xl font-bold text-white mt-1" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{demoExercise.name}</h3>
                    </div>
                    <span className="rounded-full border border-neon-cyan/40 px-3 py-1 text-[10px] font-black uppercase text-neon-cyan">{demoExercise.type}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-white/70">
                    <div className="glass-card rounded-2xl p-3">
                      <span className="text-white/40">Sets</span>
                      <div className="font-bold text-white mt-1">{demoExercise.sets}</div>
                    </div>
                    <div className="glass-card rounded-2xl p-3">
                      <span className="text-white/40">Reps</span>
                      <div className="font-bold text-white mt-1">{demoExercise.reps}</div>
                    </div>
                    <div className="glass-card rounded-2xl p-3">
                      <span className="text-white/40">Rest</span>
                      <div className="font-bold text-white mt-1">{demoExercise.rest}s</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-neon-red">Coaching Tips</div>
                    <ul className="mt-2 space-y-2 text-[11px] text-white/80">
                      {(demoExercise.tips ?? [
                        'Keep your back straight',
                        'Control the negative phase',
                        'Brace your core through the movement',
                      ]).map((tip) => (
                        <li key={tip} className="flex items-start gap-2"><Sparkles size={12} className="mt-0.5 shrink-0 text-neon-cyan" />{tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button type="button" className="flex-1 glass-card px-4 py-3 rounded-2xl text-white/70 hover:text-white" onClick={() => setShowDemoModal(false)}>Close</button>
                    <button type="button" className="flex-1 bg-neon-cyan px-4 py-3 rounded-2xl font-black text-ink-900" onClick={() => setShowDemoModal(false)}>Start Exercise</button>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}
