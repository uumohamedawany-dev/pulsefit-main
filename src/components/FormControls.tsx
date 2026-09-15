import { ChevronDown, Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

const shellClass = 'relative flex min-h-12 items-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 shadow-inner shadow-black/20 transition focus-within:border-cyan-300/60 focus-within:shadow-[0_0_18px_rgba(34,211,238,0.12)]';
const buttonClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 transition hover:bg-cyan-400/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35';

export function DarkSelect({ label, value, onChange, options, icon }: { label?: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; icon?: ReactNode }) {
  return (
    <label className="block min-w-0">
      {label && <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{label}</span>}
      <span className={`${shellClass} px-3`}>
        {icon && <span className="mr-2 text-cyan-300">{icon}</span>}
        <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent py-3 pr-7 text-sm font-semibold text-white outline-none [&>option]:bg-zinc-950 [&>option]:text-white [&>option:checked]:bg-cyan-500">
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 text-cyan-300" />
      </span>
    </label>
  );
}

export function NumberStepper({ label, value, min = 0, max = 999, step = 1, unit, onChange }: { label?: string; value: number; min?: number; max?: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  const update = (next: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(next) ? next : min)));

  return (
    <label className="block min-w-0">
      {label && <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{label}</span>}
      <span className={shellClass + ' gap-1 p-1'}>
        <button type="button" className={buttonClass} onClick={() => update(value - step)} disabled={value <= min} aria-label={`Decrease ${label || 'value'}`}><Minus size={16} /></button>
        <span className="flex min-w-0 flex-1 items-center justify-center px-1">
          <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => update(Number(event.target.value))} className="w-full min-w-0 appearance-none bg-transparent text-center text-lg font-display font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" aria-label={label || 'Value'} />
        </span>
        <button type="button" className={buttonClass} onClick={() => update(value + step)} disabled={value >= max} aria-label={`Increase ${label || 'value'}`}><Plus size={16} /></button>
      </span>
    </label>
  );
}
