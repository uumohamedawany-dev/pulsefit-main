import type { ReactNode } from 'react';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="bg-orb w-[400px] h-[400px] bg-neon-cyan/[0.07] -top-20 -left-20 animate-float" />
      <div className="bg-orb w-[350px] h-[350px] bg-neon-blue/[0.06] top-1/3 -right-16 animate-float" style={{ animationDelay: '2s' }} />
      <div className="bg-orb w-[300px] h-[300px] bg-neon-green/[0.04] bottom-0 left-1/4 animate-float" style={{ animationDelay: '4s' }} />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 30c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10zm10 0c0-5.523 4.477-10 10-10v20c-5.523 0-10-4.477-10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass-panel ${className}`}>{children}</div>;
}

export function GlassCard({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.12] hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      {children}
    </div>
  );
}

export function ToggleSwitch({
  checked,
  onChange,
  activeColor = 'neon-cyan',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  activeColor?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`toggle-track ${checked ? 'toggle-active' : ''}`}
      style={{
        backgroundColor: checked ? `var(--color-${activeColor}, #22F5D6)` : 'rgba(255,255,255,0.08)',
        boxShadow: checked ? `0 0 16px rgba(34,245,214,0.3)` : 'none',
      }}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

export function NeonButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const base = 'relative w-full py-4 rounded-2xl font-display font-bold text-base transition-all duration-300 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary: 'bg-gradient-to-r from-neon-cyan to-neon-blue text-ink-900 neon-glow-cyan hover:shadow-[0_0_40px_rgba(34,245,214,0.4)]',
    secondary: 'glass-card text-white hover:bg-white/[0.08] hover:border-white/[0.15]',
    ghost: 'text-white/60 hover:text-white hover:bg-white/[0.04]',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  max,
  color = 'neon-cyan',
  height = 'h-2',
}: {
  value: number;
  max: number;
  color?: string;
  height?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full ${height} bg-white/[0.06] rounded-full overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out`}
        style={{
          width: `${pct}%`,
          background: color === 'neon-cyan' ? 'linear-gradient(90deg, #22F5D6, #4FA8FF)' :
                       color === 'neon-green' ? 'linear-gradient(90deg, #39FF88, #22F5D6)' :
                       color === 'neon-orange' ? 'linear-gradient(90deg, #FF8A3D, #FF4D8D)' :
                       color === 'neon-pink' ? 'linear-gradient(90deg, #FF4D8D, #A855F7)' :
                       'linear-gradient(90deg, #4FA8FF, #A855F7)',
          boxShadow: `0 0 12px rgba(34,245,214,0.3)`,
        }}
      />
    </div>
  );
}
