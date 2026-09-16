import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, Dumbbell, Sparkles, Timer } from 'lucide-react';
import { GlassCard, GlassPanel } from '@/components/GlassUI';
import { ProGate } from '@/components/ProGate';
import { useApp } from '@/context/AppContext';
import { getWorkoutDatabase } from '@/data/workoutDatabase';
import type { WorkoutExercise } from '@/types';

type Equipment = 'bodyweight' | 'dumbbells' | 'gym';
type Duration = 15 | 30 | 45;

export function WorkoutGeneratorScreen() {
  const { appMode, setScreen, completeWorkout } = useApp();
  const [equipment, setEquipment] = useState<Equipment>('bodyweight');
  const [duration, setDuration] = useState<Duration>(30);
  const [routine, setRoutine] = useState<WorkoutExercise[]>([]);
  const [notice, setNotice] = useState('');

  const generateRoutine = () => {
    const catalog = getWorkoutDatabase(appMode);
    const allExercises = Object.values(catalog).flat().filter((exercise) => equipment === 'bodyweight' ? exercise.type === 'Home' : equipment === 'dumbbells' ? exercise.type === 'Gym' && exercise.icon === 'Dumbbell' : exercise.type === 'Gym');
    const count = duration === 15 ? 4 : duration === 30 ? 6 : 8;
    const shuffled = [...allExercises].sort(() => Math.random() - 0.5);
    setRoutine(shuffled.slice(0, Math.min(count, shuffled.length)));
    setNotice('اتعملت لك تمرينة متوازنة حسب وقتك وإمكانياتك.');
  };

  const totalSets = useMemo(() => routine.reduce((sum, exercise) => sum + exercise.sets, 0), [routine]);

  const startRoutine = () => {
    if (!routine.length) return;
    completeWorkout();
    setNotice('عاش يا وحش! التمرينة اتسجلت في يومك وزودت الستريك والنقاط 🔥');
  };

  return (
    <div className="min-h-screen px-4 pb-28 pt-6 safe-top"><div className="mx-auto max-w-md space-y-4"><div className="flex items-center justify-between"><div><span className="text-xs uppercase tracking-[0.2em] text-white/40">PulseFit AI</span><h1 className="mt-1 font-display text-3xl font-bold text-white">مولد التمارين الذكي</h1></div><button type="button" onClick={() => setScreen('workout')} className="glass-card rounded-2xl p-3 text-white/70 hover:text-neon-cyan" aria-label="العودة للتمرين"><ArrowLeft size={18} /></button></div>
      <ProGate feature="Smart random workout generator"><GlassPanel className="p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-neon-cyan" /><span className="text-sm font-semibold text-white">اختار ظروف تمرينك</span></div><div className="mt-5"><div className="text-[11px] uppercase tracking-[0.14em] text-white/45">الأدوات المتاحة</div><div className="mt-2 grid grid-cols-3 gap-2">{([['bodyweight', 'بوز الجسم'], ['dumbbells', 'دمبلز'], ['gym', 'جيم متكامل']] as Array<[Equipment, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setEquipment(value)} className={`rounded-2xl border px-2 py-3 text-[10px] font-bold transition ${equipment === value ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-white/55'}`}><Dumbbell size={15} className="mx-auto mb-1" />{label}</button>)}</div></div><div className="mt-5"><div className="text-[11px] uppercase tracking-[0.14em] text-white/45">الوقت المتاح</div><div className="mt-2 grid grid-cols-3 gap-2">{([15, 30, 45] as Duration[]).map((value) => <button key={value} type="button" onClick={() => setDuration(value)} className={`rounded-2xl border px-3 py-3 text-xs font-bold transition ${duration === value ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-white/10 text-white/55'}`}><Timer size={15} className="mx-auto mb-1" />{value} دقيقة</button>)}</div></div><button type="button" onClick={generateRoutine} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-xs font-black text-ink-900"><Sparkles size={15} />ولّد تمرينتي</button></GlassPanel>
        {routine.length > 0 && <GlassPanel className="p-5"><div className="flex items-center justify-between"><div><span className="text-[10px] uppercase tracking-[0.16em] text-neon-cyan">Generated Routine</span><h2 className="mt-1 text-xl font-bold text-white">تمرينتك جاهزة</h2></div><span className="flex items-center gap-1 text-[10px] text-white/45"><Clock3 size={13} />{duration} دقيقة • {totalSets} sets</span></div><div className="mt-4 space-y-2">{routine.map((exercise, index) => <GlassCard key={`${exercise.name}-${index}`} className="p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-white">{index + 1}. {exercise.name}</div><div className="mt-1 text-[10px] text-white/45">{exercise.sets} مجموعات • {exercise.reps} تكرار • راحة {exercise.rest} ثانية</div></div><CheckCircle2 size={16} className="text-neon-green" /></div></GlassCard>)}</div><button type="button" onClick={startRoutine} className="mt-5 w-full rounded-2xl bg-neon-green px-4 py-3 text-xs font-black text-ink-900">ابدأ وسجل التمرينة</button></GlassPanel>}
        {notice && <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-3 text-center text-xs text-neon-cyan">{notice}</div>}</ProGate></div></div>
  );
}
