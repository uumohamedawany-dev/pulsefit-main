import React from 'react';
import { Dumbbell } from 'lucide-react';

interface DefaultAvatarProps {
  gender?: 'male' | 'female' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ gender = 'male', size = 'md' }) => {
  const isFemale = gender === 'female';

  const dimensions = {
    sm: { width: 36, height: 36 },
    md: { width: 48, height: 48 },
    lg: { width: 80, height: 80 },
  }[size];

  const neonColor = isFemale ? '#ec4899' : '#06b6d4';
  const glowColor = isFemale ? 'rgba(236, 72, 153, 0.4)' : 'rgba(6, 182, 212, 0.4)';
  const gradientBackground = isFemale
    ? 'linear-gradient(135deg, rgba(236,72,153,0.28), rgba(168,85,247,0.18))'
    : 'linear-gradient(135deg, rgba(6,182,212,0.28), rgba(59,130,246,0.18))';

  return (
    <div
      style={{
        width: dimensions.width,
        height: dimensions.height,
        borderRadius: '50%',
        background: gradientBackground,
        border: `1.5px solid ${neonColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 15px ${glowColor}, inset 0 0 10px ${glowColor}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isFemale
            ? 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
        }}
      />

      <Dumbbell
        size={size === 'lg' ? 28 : size === 'sm' ? 14 : 20}
        style={{
          position: 'relative',
          zIndex: 1,
          color: neonColor,
          filter: isFemale ? 'drop-shadow(0 0 12px rgba(236,72,153,0.6))' : 'drop-shadow(0 0 12px rgba(6,182,212,0.6))',
        }}
      />
    </div>
  );
};
