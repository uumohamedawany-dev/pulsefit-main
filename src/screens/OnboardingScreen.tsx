import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Scale, Ruler, UserRound, Target, Activity } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { GlassPanel, NeonButton } from '@/components/GlassUI';
import { updateUserProfile } from '@/lib/api';
import type { Gender, MacroGoal, OnboardingProfile } from '@/types';
import { NumberStepper } from '@/components/FormControls';

const stepLabels = ['Gender', 'Age', 'Body', 'Goal'];

export function OnboardingScreen() {
  const { completeOnboarding, appMode, setAppMode, user } = useApp();
  const femaleMode = appMode === 'female';
  const [step, setStep] = useState(0);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [profile, setProfile] = useState<OnboardingProfile>({
    gender: appMode === 'female' ? 'female' : 'male',
    age: 28,
    weight: 72,
    height: 176,
    goal: 'maintenance',
  });

  const progress = useMemo(() => ((step + 1) / stepLabels.length) * 100, [step]);

  const updateProfile = <K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const next = () => setStep((current) => Math.min(current + 1, stepLabels.length - 1));
  const previous = () => setStep((current) => Math.max(current - 1, 0));

  const handleGenderSelect = (gender: Gender) => {
    updateProfile('gender', gender);
    setAppMode(gender);
  };

  const finish = async () => {
    if (!user?.email) {
      setSaveError('Your session is missing an email address. Please sign in again and try once more.');
      return;
    }

    setSaveError('');
    setIsSavingProfile(true);

    try {
      const response = await updateUserProfile({
        email: user.email,
        username: user.email.split('@')[0],
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        streakDays: 0,
        goal: profile.goal,
      });

      if (!response.success) {
        throw new Error(response.message || 'Profile setup could not be completed.');
      }

      completeOnboarding(profile);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Profile setup could not be saved. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-10 transition-all duration-500 ${femaleMode ? 'bg-gradient-to-br from-pink-950 via-rose-950 to-black' : 'bg-zinc-950'}`}>
      <div className="w-full max-w-2xl animate-fade-in-up">
        <GlassPanel className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-[11px] uppercase tracking-[0.22em] ${femaleMode ? 'text-pink-300/90' : 'text-cyan-300/90'}`}>PulseFit Setup</span>
              <h1 className="font-display text-3xl font-bold text-white mt-2">Your Fitness Profile</h1>
            </div>
            <div className="rounded-2xl glass-card px-4 py-2">
              <span className="text-xs uppercase text-white/50">Step {step + 1} / {stepLabels.length}</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${femaleMode ? 'bg-gradient-to-r from-pink-400 to-rose-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-7">
            {step === 0 && (
              <StepContent title="Choose your gender" subtitle="We’ll use this for your baseline estimate." femaleMode={femaleMode}>
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as Gender[]).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => handleGenderSelect(gender)}
                      className={`rounded-3xl border px-5 py-6 transition-all duration-300 ${profile.gender === gender
                        ? femaleMode
                          ? 'border-pink-400 bg-pink-500/10 backdrop-blur-md shadow-[0_0_24px_rgba(244,114,182,0.25)] text-white'
                          : 'border-cyan-500 bg-cyan-500/10 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.4)] text-white'
                        : 'border-zinc-700 bg-zinc-900/50 backdrop-blur-md text-white/80 hover:bg-zinc-800/60'}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <UserRound size={28} className={profile.gender === gender ? (femaleMode ? 'text-pink-300' : 'text-cyan-400') : 'text-white/50'} />
                        <span className="text-sm font-semibold capitalize">{gender}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </StepContent>
            )}

            {step === 1 && (
              <StepContent title="How old are you?" subtitle="Age helps personalize your energy targets." femaleMode={femaleMode}>
                <div className="mx-auto max-w-sm"><NumberStepper label="Age" value={profile.age} min={10} max={90} onChange={(value) => updateProfile('age', value)} /></div>
              </StepContent>
            )}

            {step === 2 && (
              <StepContent title="Body measurements" subtitle="We’ll estimate your nutrition baseline." femaleMode={femaleMode}>
                <div className="grid grid-cols-2 gap-4"><NumberStepper label="Weight" value={profile.weight} min={1} max={300} onChange={(value) => updateProfile('weight', value)} /><NumberStepper label="Height" value={profile.height} min={1} max={250} onChange={(value) => updateProfile('height', value)} /></div>
              </StepContent>
            )}

            {step === 3 && (
              <StepContent title="Primary goal" subtitle="Pick the training direction that fits your plan." femaleMode={femaleMode}>
                <div className="grid grid-cols-3 gap-3">
                  {(['cutting', 'bulking', 'maintenance'] as MacroGoal[]).map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => updateProfile('goal', goal)}
                      className={`rounded-2xl border px-4 py-4 transition-all duration-300 ${profile.goal === goal
                        ? femaleMode
                          ? 'bg-pink-500/10 border-pink-400 text-white shadow-[0_0_24px_rgba(244,114,182,0.2)] backdrop-blur-md'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.35)]'
                        : 'border-zinc-700 bg-zinc-900/50 backdrop-blur-md text-white/70 hover:bg-zinc-800/60'}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Target size={22} className={profile.goal === goal ? 'text-white' : 'text-cyan-400'} />
                        <span className="text-[11px] font-semibold uppercase">{goal}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </StepContent>
            )}
          </div>

          {saveError && (
            <div className="mt-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={previous}
              disabled={step === 0}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 disabled:opacity-40 ${femaleMode ? 'text-pink-200/80 hover:text-white' : 'text-white/50 hover:text-white'}`}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex gap-2">
              {stepLabels.map((label, index) => (
                <span
                  key={label}
                  className={`h-1.5 w-8 rounded-full transition-all duration-300 ${index <= step ? (femaleMode ? 'bg-pink-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500') : 'bg-white/[0.08]'}`}
                />
              ))}
            </div>

            {step < stepLabels.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-300 ${femaleMode ? 'border border-pink-400/40 bg-pink-500/10 backdrop-blur-md text-white hover:text-pink-100' : 'border border-cyan-500/50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.3)] hover:brightness-110'}`}
              >
                Next
                <ArrowRight size={16} />
              </button>
            ) : (
              <NeonButton
                variant="secondary"
                onClick={finish}
                disabled={isSavingProfile}
                className={`!w-auto px-6 rounded-2xl border disabled:cursor-not-allowed disabled:opacity-70 ${femaleMode ? 'border-pink-400/40 bg-pink-500/10 text-white backdrop-blur-md hover:bg-pink-500/15' : 'border-cyan-500/50 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_18px_rgba(6,182,212,0.3)] hover:brightness-110'}`}
              >
                <span className="flex items-center gap-2">
                  {isSavingProfile ? 'Saving Profile...' : 'Complete Profile'}
                  {!isSavingProfile && <ArrowRight size={16} />}
                </span>
              </NeonButton>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function StepContent({ title, subtitle, children, femaleMode }: { title: string; subtitle: string; children: React.ReactNode; femaleMode: boolean }) {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-5">
        <span className={`text-sm uppercase tracking-[0.2em] ${femaleMode ? 'text-pink-300' : 'text-cyan-300'}`}>Profile</span>
        <h2 className="font-display text-3xl font-bold text-white mt-2">{title}</h2>
        <p className="text-white/50 text-sm mt-2">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
