import { useEffect, useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AmbientBackground } from '@/components/GlassUI';
import { BottomNav } from '@/components/BottomNav';
import { AuthScreen } from '@/screens/AuthScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { DietScreen } from '@/screens/DietScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { DietMealsScreen } from '@/screens/DietMealsScreen';
import { PlansScreen } from '@/screens/PlansScreen';
import { FriendsScreen } from '@/screens/FriendsScreen';
import { WorkoutScreen } from '@/screens/WorkoutScreen';
import { WorkoutGeneratorScreen } from '@/screens/WorkoutGeneratorScreen';
import { isAdminUser } from '@/lib/api';
import { performBiometricAuthentication, checkBiometricAvailability } from '@/lib/permissions';
import type { Screen } from '@/types';

function ScreenRenderer() {
  const { currentScreen, isAuthenticated, user } = useApp();
  const screen: Screen = isAuthenticated ? currentScreen : 'auth';
  const protectedScreen = screen === 'admin' && !isAdminUser(user) ? 'dashboard' : screen;

  return (
    <div key={protectedScreen} className="animate-fade-in">
      {protectedScreen === 'auth' && <AuthScreen />}
      {protectedScreen === 'onboarding' && <OnboardingScreen />}
      {protectedScreen === 'dashboard' && <DashboardScreen />}
      {protectedScreen === 'diet' && <DietMealsScreen />}
      {protectedScreen === 'plans' && <PlansScreen />}
      {protectedScreen === 'friends' && <FriendsScreen />}
      {protectedScreen === 'profile' && <ProfileScreen />}
      {protectedScreen === 'workout' && <WorkoutScreen />}
      {protectedScreen === 'generator' && <WorkoutGeneratorScreen />}
      {protectedScreen === 'admin' && <AdminScreen />}
    </div>
  );
}

function AppShell() {
  const { isAuthenticated, appMode, t, securitySettings, biometricPromptPending, setBiometricPromptPending, updateSecuritySettings } = useApp();
  const isFemale = appMode === 'female';
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [appLockVisible, setAppLockVisible] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle('theme-female', isFemale);
    body.classList.toggle('theme-female', isFemale);
    body.classList.toggle('light', false);
    body.classList.toggle('dark', true);
  }, [isFemale]);

  useEffect(() => {
    if (!isAuthenticated || !securitySettings.biometricPromptSeen) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && securitySettings.appLockEnabled) {
        setAppLockVisible(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isAuthenticated, securitySettings.appLockEnabled, securitySettings.biometricPromptSeen]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (biometricPromptPending) {
      setShowBiometricPrompt(true);
    }
  }, [biometricPromptPending, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (!securitySettings.appLockEnabled) {
      return;
    }

    const handleAppResume = () => {
      setAppLockVisible(true);
    };

    window.addEventListener('focus', handleAppResume);

    return () => window.removeEventListener('focus', handleAppResume);
  }, [isAuthenticated, securitySettings.appLockEnabled]);

  const handleBiometricPrompt = async (enable: boolean) => {
    setShowBiometricPrompt(false);
    setBiometricPromptPending(false);

    if (enable) {
      const available = await checkBiometricAvailability();
      if (!available.supported || available.denied) {
        updateSecuritySettings({ ...securitySettings, biometricLoginEnabled: false, biometricPromptSeen: true });
        return;
      }

      const authenticated = await performBiometricAuthentication('Enable biometric login');
      if (authenticated) {
        updateSecuritySettings({ ...securitySettings, biometricLoginEnabled: true, biometricPromptSeen: true });
      } else {
        updateSecuritySettings({ ...securitySettings, biometricLoginEnabled: false, biometricPromptSeen: true });
      }
      return;
    }

    updateSecuritySettings({ ...securitySettings, biometricLoginEnabled: false, biometricPromptSeen: true });
  };

  const handleAppLockUnlock = async () => {
    const unlocked = await performBiometricAuthentication('Unlock PulseFit');
    if (!unlocked) {
      setAppLockVisible(false);
      return;
    }

    setAppLockVisible(false);
  };

  const shellClasses = isFemale
    ? 'bg-gradient-to-br from-pink-950 via-zinc-950 to-black text-pink-50'
    : 'bg-zinc-950 text-white';

  return (
    <div className={`relative min-h-screen transition-all duration-500 ${shellClasses}`}>
      <AmbientBackground />
      <ScreenRenderer />
      {isAuthenticated && <BottomNav />}

      {showBiometricPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111827]/90 p-5 shadow-2xl shadow-cyan-950/30">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-neon-cyan">
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">{t('Security')}</p>
                <h3 className="mt-1 text-xl font-bold text-white">{t('Enable Biometric Login')}</h3>
              </div>
            </div>
            <p className="text-sm leading-6 text-white/70">
              Use Face ID or Fingerprint for faster sign-in and stronger protection on future app launches.
            </p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => void handleBiometricPrompt(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.06]">
                {t('Not now')}
              </button>
              <button type="button" onClick={() => void handleBiometricPrompt(true)} className="flex-1 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-sm font-bold text-ink-900 transition hover:scale-[1.01]">
                {t('Enable')}
              </button>
            </div>
          </div>
        </div>
      )}

      {appLockVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0f172a]/90 p-5 text-center shadow-2xl shadow-cyan-950/30">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl text-neon-cyan">
              🔐
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">{t('App Locked')}</h3>
            <p className="mt-2 text-sm text-white/65">{t('Authenticate to continue using PulseFit.')}</p>
            <button type="button" onClick={() => void handleAppLockUnlock()} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-sm font-bold text-ink-900 transition hover:scale-[1.01]">
              {t('Unlock with Biometrics')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
