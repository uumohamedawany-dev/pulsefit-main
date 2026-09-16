import { Home, Apple, User, Dumbbell, Target, Users, WandSparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Screen } from '@/types';

const navItems: { screen: Screen; label: string; icon: typeof Home }[] = [
  { screen: 'dashboard', label: 'Home', icon: Home },
  { screen: 'diet', label: 'Diet', icon: Apple },
  { screen: 'plans', label: 'Plans', icon: Target },
  { screen: 'friends', label: 'Friends', icon: Users },
  { screen: 'workout', label: 'Workouts', icon: Dumbbell },
  { screen: 'generator', label: 'Smart', icon: WandSparkles },
  { screen: 'profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const { currentScreen, setScreen, appMode, t } = useApp();
  const femaleMode = appMode === 'female';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center safe-bottom px-2 pb-2">
      <nav className={`rounded-3xl px-3 py-2 mx-4 mb-2 flex w-full max-w-md items-center gap-1 ${femaleMode ? 'bg-black/60 backdrop-blur-xl border border-pink-500/20 shadow-[0_-8px_24px_rgba(236,72,153,0.18)]' : 'bg-black/60 backdrop-blur-xl border-t border-zinc-800 shadow-[0_-8px_24px_rgba(24,24,27,0.28)]'}`}>
        {navItems.map(({ screen, label, icon: Icon }) => {
          const active = currentScreen === screen;
          return (
            <button
              key={screen}
              onClick={() => setScreen(screen)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-all duration-300 ease-in-out"
            >
              <Icon
                size={22}
                className={`transition-all duration-300 ease-in-out ${
                  active
                    ? femaleMode
                      ? 'scale-110 text-pink-500'
                      : 'scale-110 text-cyan-400'
                    : 'text-white/40'
                }`}
                style={active ? { filter: femaleMode ? 'drop-shadow(0 0 8px rgba(236,72,153,0.5))' : 'drop-shadow(0 0 8px rgba(34,245,214,0.5))' } : {}}
              />
              <div className="flex flex-col items-center">
                <span
                  className={`text-[10px] font-medium transition-all duration-300 ease-in-out ${
                    active ? femaleMode ? 'text-pink-500' : 'text-cyan-400' : 'text-white/30'
                  }`}
                >
                  {t(label)}
                </span>
                {active && <span className={`mt-1 h-1.5 w-1.5 rounded-full ${femaleMode ? 'bg-pink-500' : 'bg-cyan-400'}`} />}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
