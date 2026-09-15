/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#06070B',
          800: '#0A0C13',
          700: '#0F1119',
          600: '#141826',
          500: '#1B2030',
        },
        neon: {
          cyan: '#22F5D6',
          green: '#39FF88',
          blue: '#4FA8FF',
          purple: '#A855F7',
          pink: '#FF4D8D',
          orange: '#FF8A3D',
          red: '#FF3B4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeInDown: { '0%': { opacity: '0', transform: 'translateY(-24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.92)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(100%)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34,245,214,0.15), 0 0 60px rgba(34,245,214,0.05)' },
          '50%': { boxShadow: '0 0 40px rgba(34,245,214,0.35), 0 0 100px rgba(34,245,214,0.12)' },
        },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        ripple: { '0%': { transform: 'scale(0)', opacity: '0.6' }, '100%': { transform: 'scale(4)', opacity: '0' } },
      },
    },
  },
  plugins: [],
};
