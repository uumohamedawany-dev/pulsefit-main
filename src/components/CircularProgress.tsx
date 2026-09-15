import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  unit?: string;
}

export function CircularProgress({
  value,
  max,
  size = 200,
  strokeWidth = 14,
  label,
  sublabel,
  unit = '',
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((animatedValue / max) * 100, 100);
  const dashOffset = circumference - (pct / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22F5D6" />
            <stop offset="50%" stopColor="#4FA8FF" />
            <stop offset="100%" stopColor="#39FF88" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <span className="text-4xl font-display font-bold text-white tabular-nums">
            {Math.round((animatedValue / max) * 100)}
            <span className="text-xl text-white/40">%</span>
          </span>
        )}
        {sublabel && (
          <span className="text-sm text-white/50 mt-1">
            {animatedValue}{unit} / {max}{unit}
          </span>
        )}
      </div>
    </div>
  );
}
