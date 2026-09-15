import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { MetricHistoryEntry } from '@/types';

type MetricKey = 'steps' | 'activeCalories' | 'waterConsumed' | 'streakDays';
type Range = 7 | 30;

const metrics: Array<{ key: MetricKey; label: string; color: string }> = [
  { key: 'steps', label: 'Steps', color: '#22d3ee' },
  { key: 'activeCalories', label: 'Calories', color: '#34d399' },
  { key: 'waterConsumed', label: 'Water', color: '#60a5fa' },
  { key: 'streakDays', label: 'Streak', color: '#fbbf24' },
];

function formatDay(dayKey: string) {
  return new Date(`${dayKey}T12:00:00`).toLocaleDateString([], { weekday: 'short' });
}

function buildEntries(history: MetricHistoryEntry[], range: Range) {
  const today = new Date();
  const entries: MetricHistoryEntry[] = [];
  for (let offset = range - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    entries.push(history.find((entry) => entry.dayKey === dayKey) || { dayKey, steps: 0, activeCalories: 0, waterConsumed: 0, streakDays: 0 });
  }
  return entries;
}

export function MetricTrends() {
  const { metricHistory } = useApp();
  const [metric, setMetric] = useState<MetricKey>('steps');
  const [range, setRange] = useState<Range>(7);
  const selected = metrics.find((item) => item.key === metric) || metrics[0];
  const entries = useMemo(() => buildEntries(metricHistory, range), [metricHistory, range]);
  const values = entries.map((entry) => Number(entry[metric]) || 0);
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${92 - (value / max) * 78}`).join(' ');

  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-inner shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70">Health trends</p>
          <h2 className="mt-1 text-lg font-bold text-white">Daily history</h2>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {[7, 30].map((value) => (
            <button key={value} type="button" onClick={() => setRange(value as Range)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${range === value ? 'bg-cyan-400/15 text-cyan-200' : 'text-white/45'}`}>
              {value}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {metrics.map((item) => (
          <button key={item.key} type="button" onClick={() => setMetric(item.key)} className={`rounded-xl border px-2 py-2 text-[10px] font-bold ${metric === item.key ? 'border-cyan-300/50 bg-cyan-400/10 text-white' : 'border-white/10 text-white/45'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-white/45">
          <span>{selected.label}</span>
          <strong style={{ color: selected.color }}>{values[values.length - 1].toLocaleString()}</strong>
        </div>
        <svg viewBox="0 0 100 100" className="h-40 w-full overflow-visible" role="img" aria-label={`${selected.label} daily trend`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="metric-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={selected.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={selected.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={`0,92 ${points} 100,92`} fill="url(#metric-fill)" stroke="none" />
          <polyline points={points} fill="none" stroke={selected.color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-1 flex justify-between text-[9px] text-white/35">
          <span>{formatDay(entries[0].dayKey)}</span>
          <span>{formatDay(entries[entries.length - 1].dayKey)}</span>
        </div>
      </div>
    </section>
  );
}
