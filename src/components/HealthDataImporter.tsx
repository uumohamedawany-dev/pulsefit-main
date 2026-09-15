import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { Activity, CheckCircle2, Clock3, CloudUpload, Footprints, HeartPulse, MoonStar, Sparkles, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface HealthDataImporterProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportMode = 'manual' | 'screenshot';

type FormState = {
  steps: number;
  heartRate: number;
  activeCalories: number;
  sleepHours: number;
};

const getInitialForm = (stats: ReturnType<typeof useApp>['dailyStats']) => ({
  steps: stats.steps,
  heartRate: stats.heartRateResting,
  activeCalories: stats.activeCalories,
  sleepHours: Number((stats.sleepHours + stats.sleepMinutes / 60).toFixed(1)),
});

const getMockExtraction = (fileName: string): FormState => {
  const normalized = fileName.toLowerCase();

  if (normalized.includes('samsung')) {
    return {
      steps: 8412,
      heartRate: 68,
      activeCalories: 410,
      sleepHours: 7.3,
    };
  }

  if (normalized.includes('apple')) {
    return {
      steps: 9640,
      heartRate: 71,
      activeCalories: 483,
      sleepHours: 6.9,
    };
  }

  return {
    steps: 10120,
    heartRate: 66,
    activeCalories: 516,
    sleepHours: 7.6,
  };
};

export function HealthDataImporter({ isOpen, onClose }: HealthDataImporterProps) {
  const { appMode, dailyStats, updateDailyStats } = useApp();
  const isFemale = appMode === 'female';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const accent = isFemale
    ? {
        text: 'text-rose-300',
        border: 'border-rose-400/40',
        glow: 'shadow-[0_0_24px_rgba(244,114,182,0.4)]',
        iconBg: 'bg-rose-500/10',
        button: 'border-rose-400/50 bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-rose-100',
        chip: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
        inputFocus: 'focus:border-rose-400',
      }
    : {
        text: 'text-cyan-300',
        border: 'border-cyan-400/40',
        glow: 'shadow-[0_0_24px_rgba(34,211,238,0.4)]',
        iconBg: 'bg-cyan-500/10',
        button: 'border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-sky-500/10 text-cyan-100',
        chip: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
        inputFocus: 'focus:border-cyan-400',
      };

  const [mode, setMode] = useState<ImportMode>('manual');
  const [form, setForm] = useState<FormState>(getInitialForm(dailyStats));
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [lastUploadedFile, setLastUploadedFile] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setForm(getInitialForm(dailyStats));
    setMode('manual');
    setIsDragging(false);
    setIsAnalyzing(false);
    setSaveState('idle');
    setLastUploadedFile('');
  }, [isOpen, dailyStats]);

  if (!isOpen) return null;

  const updateField = (field: keyof FormState, value: string) => {
    const normalized = Number(value);
    setForm((current) => ({
      ...current,
      [field]: Number.isFinite(normalized) ? normalized : 0,
    }));
    setSaveState('idle');
  };

  const handleFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    setIsDragging(false);
    setLastUploadedFile(file.name);
    setIsAnalyzing(true);
    setMode('screenshot');

    window.setTimeout(() => {
      const extracted = getMockExtraction(file.name);
      setForm(extracted);
      setIsAnalyzing(false);
      setSaveState('idle');
    }, 1200);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleSave = () => {
    const sleepHours = Math.max(0, Number(form.sleepHours) || 0);
    const wholeHours = Math.floor(sleepHours);
    const remainderMinutes = Math.round((sleepHours - wholeHours) * 60);

    updateDailyStats({
      steps: Math.max(0, Math.round(form.steps)),
      heartRateResting: Math.max(0, Math.round(form.heartRate)),
      heartRatePeak: Math.max(Math.round(form.heartRate * 1.1), Math.round(form.heartRate)),
      activeCalories: Math.max(0, Math.round(form.activeCalories)),
      sleepHours: wholeHours,
      sleepMinutes: Math.min(59, Math.max(0, remainderMinutes)),
    });

    setSaveState('saved');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl">
        <div className="rounded-[30px] border border-white/10 bg-zinc-950/75 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-[0.22em] ${accent.text}`}>
                Fitness Sync
              </span>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">Health Data Importer</h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/70 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-1.5">
            {(['manual', 'screenshot'] as ImportMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`flex-1 rounded-2xl px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all ${
                  mode === option
                    ? `${accent.button} ${accent.glow}`
                    : 'bg-transparent text-white/50 hover:text-white'
                }`}
              >
                {option === 'manual' ? 'Manual Entry' : 'Smart Scan'}
              </button>
            ))}
          </div>

          {mode === 'manual' ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="block rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Steps
                <input
                  type="number"
                  min="0"
                  value={form.steps}
                  onChange={(event) => updateField('steps', event.target.value)}
                  className={`mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white outline-none placeholder:text-white/30 ${accent.inputFocus}`}
                />
              </label>

              <label className="block rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Heart Rate (BPM)
                <input
                  type="number"
                  min="0"
                  value={form.heartRate}
                  onChange={(event) => updateField('heartRate', event.target.value)}
                  className={`mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white outline-none placeholder:text-white/30 ${accent.inputFocus}`}
                />
              </label>

              <label className="block rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Active Calories
                <input
                  type="number"
                  min="0"
                  value={form.activeCalories}
                  onChange={(event) => updateField('activeCalories', event.target.value)}
                  className={`mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white outline-none placeholder:text-white/30 ${accent.inputFocus}`}
                />
              </label>

              <label className="block rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                Sleep (hours)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.sleepHours}
                  onChange={(event) => updateField('sleepHours', event.target.value)}
                  className={`mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white outline-none placeholder:text-white/30 ${accent.inputFocus}`}
                />
              </label>
            </div>
          ) : (
            <div className="mt-5">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group cursor-pointer rounded-[24px] border border-dashed p-6 text-center transition-all ${
                  isDragging
                    ? `${accent.border} bg-white/[0.05] ${accent.glow}`
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInputChange}
                />

                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${accent.iconBg} ${accent.glow}`}>
                  <CloudUpload className={accent.text} size={24} />
                </div>

                <h4 className="mt-4 font-display text-xl font-bold text-white">Import a fitness screenshot</h4>
                <p className="mt-2 text-sm text-white/55">
                  Upload a screenshot from Samsung Health, Apple Health, or Weofly Fit.
                </p>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
                  <Sparkles size={12} className={accent.text} />
                  Drag & drop or browse
                </div>

                {isAnalyzing && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/70">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-300" />
                      <span>Analyzing fitness screenshot...</span>
                    </div>
                  </div>
                )}

                {lastUploadedFile && !isAnalyzing && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/70">
                    <CheckCircle2 size={16} className={accent.text} />
                    <span>Imported: {lastUploadedFile}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                <Activity size={13} className={accent.text} />
                Extracted Metrics
              </div>
              {saveState === 'saved' && (
                <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-200">
                  <CheckCircle2 size={12} />
                  Saved
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  <Footprints size={12} className={accent.text} />
                  Steps
                </div>
                <div className="mt-2 text-2xl font-display font-bold text-white">{form.steps}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  <HeartPulse size={12} className={accent.text} />
                  Heart Rate
                </div>
                <div className="mt-2 text-2xl font-display font-bold text-white">{form.heartRate} bpm</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  <Sparkles size={12} className={accent.text} />
                  Active Calories
                </div>
                <div className="mt-2 text-2xl font-display font-bold text-white">{form.activeCalories}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                  <MoonStar size={12} className={accent.text} />
                  Sleep
                </div>
                <div className="mt-2 text-2xl font-display font-bold text-white">{form.sleepHours.toFixed(1)} hrs</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">
              <Clock3 size={12} className={accent.text} />
              Smart import ready
            </div>

            <div className="flex gap-3">
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
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition-all ${accent.button} ${accent.glow}`}
              >
                {saveState === 'saved' ? 'Saved Metrics' : 'Save Metrics'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
