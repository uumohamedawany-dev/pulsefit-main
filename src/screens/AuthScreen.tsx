import { useEffect, useState } from 'react';
import { Mail, Lock, User as UserIcon, Fingerprint, ArrowRight, Eye, EyeOff, Dumbbell, Mars, Venus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { ensureSupabaseMasterAdminAuth, loginUser, notifyTelegramRegistration, persistAuthSession, registerUser, resendOtp, verifyOtp } from '@/lib/api';
import { ensureMasterAdminProfile, mapSupabaseUser, MASTER_ADMIN_EMAIL, signInWithPassword as supabaseSignIn, signUp as supabaseSignUp, upsertUserProfile } from '@/lib/supabaseClient';
import type { AuthMode, MacroGoal } from '@/types';
import { DarkSelect, NumberStepper } from '@/components/FormControls';
import { EmailVerifiedScreen } from '@/components/EmailVerifiedScreen';
import { supabase } from '@/lib/supabaseClient';

const egyptianGovernorates = ['Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Monufia', 'Beheira', 'Gharbia', 'Kafr El Sheikh', 'Dakahlia', 'Damietta', 'Sharqia', 'Ismailia', 'Port Said', 'Suez', 'North Sinai', 'South Sinai', 'Fayoum', 'Beni Suef', 'Minya', 'Assiut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'New Valley', 'Matrouh', 'Red Sea'];
const MASTER_ADMIN_PASSWORD = 'uuadmin17092008';
const DEVICE_ACCOUNT_KEY = 'pulsefit.deviceAccountRegistered';

function hasRegisteredDeviceAccount() {
  try {
    return window.localStorage.getItem(DEVICE_ACCOUNT_KEY) === 'true';
  } catch {
    return false;
  }
}

function markDeviceAccountRegistered() {
  try {
    window.localStorage.setItem(DEVICE_ACCOUNT_KEY, 'true');
  } catch {
    // A restricted storage context should not block an otherwise valid signup.
  }
}

function getSignInErrorMessage(error: { code?: string; message?: string }) {
  switch (error.code) {
    case 'email_not_confirmed':
      return 'Please confirm your email address before signing in.';
    case 'invalid_credentials':
    case 'user_not_found':
      return 'Incorrect email or password.';
    case 'too_many_requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    default:
      return error.message || 'Sign in could not be completed. Please try again.';
  }
}

function buildOfflineMasterAdminUser() {
  return {
    email: MASTER_ADMIN_EMAIL,
    firstName: 'Yahia',
    lastName: 'Awany',
    username: 'yahiaawany',
    governorate: 'Alexandria',
    age: 18,
    height: 177,
    weight: 63,
    gender: 'male' as const,
    goal: 'maintenance' as const,
    subscriptionPlan: 'lifetime' as const,
    subscriptionStatus: 'active' as const,
  };
}

export function AuthScreen() {
  const { login, setAppMode, t, toggleLanguage, language } = useApp();
  const { requestBiometricPermission, showPermissionAlert } = usePermissions();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState<number>(72);
  const [height, setHeight] = useState<number>(176);
  const [age, setAge] = useState<number>(28);
  const [governorate, setGovernorate] = useState('');
  const [biometricPulse, setBiometricPulse] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; userId?: string; firstName: string; lastName: string; isSignup?: boolean } | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(3);
  const [verifiedUser, setVerifiedUser] = useState<ReturnType<typeof mapSupabaseUser> | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const isSupabaseCallback = searchParams.get('type') === 'signup'
      || hashParams.get('type') === 'signup'
      || searchParams.has('code');

    if (!isSupabaseCallback) {
      return;
    }

    let active = true;
    const showVerifiedSession = (user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>['user']) => {
      if (!active) {
        return;
      }

      setVerifiedUser(mapSupabaseUser(user));
      setEmailVerified(true);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        showVerifiedSession(session.user);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        showVerifiedSession(data.session.user);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!emailVerified || !verifiedUser) {
      return;
    }

    if (redirectSeconds <= 0) {
      login(verifiedUser, 'signup');
      return;
    }

    const timer = window.setTimeout(() => setRedirectSeconds((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [emailVerified, login, redirectSeconds, verifiedUser]);

  useEffect(() => {
    if (!pendingVerification) {
      setOtpCountdown(0);
      return;
    }

    if (otpCountdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOtpCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [otpCountdown, pendingVerification]);

  if (emailVerified && verifiedUser) {
    return <EmailVerifiedScreen secondsRemaining={redirectSeconds} onContinue={() => login(verifiedUser, 'signup')} />;
  }

  const createUserFromResponse = (responseUser?: { id?: string; publicUserId?: string; governorate?: string | null; createdAt?: string; firstName?: string; lastName?: string; email?: string; avatar?: string | null; profilePicture?: string | null; gender?: 'male' | 'female'; weight?: number; height?: number; age?: number; streakDays?: number; points?: number; badges?: string[]; subscriptionPlan?: 'monthly' | 'yearly' | 'lifetime'; subscriptionStatus?: 'trial' | 'active' | 'expired' | 'pending'; subscriptionExpiresAt?: string | null; goal?: MacroGoal }) => ({
    id: responseUser?.id,
    publicUserId: responseUser?.publicUserId,
    governorate: responseUser?.governorate ?? (governorate || null),
    createdAt: responseUser?.createdAt,
    firstName: responseUser?.firstName || firstName || 'Athlete',
    lastName: responseUser?.lastName || lastName || '',
    email: responseUser?.email || email,
    avatar: responseUser?.avatar ?? null,
    profilePicture: responseUser?.profilePicture ?? null,
    gender: responseUser?.gender || gender,
    weight: responseUser?.weight ?? weight,
    height: responseUser?.height ?? height,
    age: responseUser?.age ?? age,
    streakDays: responseUser?.streakDays ?? 0,
    points: responseUser?.points ?? 0,
    badges: responseUser?.badges ?? [],
    subscriptionPlan: responseUser?.subscriptionPlan,
    subscriptionStatus: responseUser?.subscriptionStatus ?? 'trial',
    subscriptionExpiresAt: responseUser?.subscriptionExpiresAt ?? null,
    goal: responseUser?.goal || 'maintenance',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (mode === 'signup' && !firstName.trim())) {
      setApiError('Please complete all required fields before continuing.');
      return;
    }

    if (mode === 'signup' && email.trim().toLowerCase() !== MASTER_ADMIN_EMAIL && hasRegisteredDeviceAccount()) {
      setApiError('Only one account is allowed per device.');
      return;
    }

    setApiError('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (email.trim().toLowerCase() === MASTER_ADMIN_EMAIL) {
          try {
            await ensureSupabaseMasterAdminAuth(MASTER_ADMIN_EMAIL, password);
            const adminSignIn = await supabaseSignIn(MASTER_ADMIN_EMAIL, password);

            if (!adminSignIn.error && adminSignIn.data.user) {
              const adminProfile = await ensureMasterAdminProfile(adminSignIn.data.user.id, MASTER_ADMIN_EMAIL);
              login({
                ...mapSupabaseUser(adminSignIn.data.user),
                firstName: adminProfile.first_name || 'Yahia',
                lastName: adminProfile.last_name || 'Awany',
                gender: 'male',
                governorate: 'Alexandria',
                age: 18,
                height: 177,
                weight: 63,
                goal: 'maintenance',
              }, 'login');
              return;
            }
          } catch {
            // Fall through to the direct backend admin login.
          }

          try {
            const adminResponse = await loginUser({ email: MASTER_ADMIN_EMAIL, password });
            if (adminResponse.success) {
              persistAuthSession(adminResponse.token);
              setAppMode('male');
              login(createUserFromResponse({
                ...adminResponse.user,
                firstName: 'Yahia',
                lastName: 'Awany',
                governorate: 'Alexandria',
                gender: 'male',
                age: 18,
                height: 177,
                weight: 63,
              }), 'login');
              return;
            }
          } catch {
            // The local fallback below is only for the exact master admin account.
          }

          if (password === MASTER_ADMIN_PASSWORD) {
            setAppMode('male');
            login(buildOfflineMasterAdminUser(), 'login');
            return;
          }

          throw new Error('Incorrect administrator password.');
        }

        try {
          const supabaseResponse = await supabaseSignUp({
            email,
            password,
            user_id: '',
            username: username.trim() || firstName.trim() || email.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            gender,
            governorate: governorate || null,
            age,
            weight,
            height,
            goal: 'maintenance',
          });

          if (!supabaseResponse.error && supabaseResponse.data.user) {
            const profile = mapSupabaseUser(supabaseResponse.data.user);
            void notifyTelegramRegistration({ userId: supabaseResponse.data.user.id, firstName, lastName, email, gender, age, height, weight, governorate: governorate || null }).catch(() => undefined);
            await upsertUserProfile({
              user_id: supabaseResponse.data.user.id,
              email,
              username: username.trim() || firstName.trim() || email.split('@')[0],
              first_name: firstName,
              last_name: lastName,
              gender,
              governorate: governorate || null,
              age,
              weight,
              height,
              goal: 'maintenance',
            });

            if (supabaseResponse.data.session) {
              login(profile, 'signup');
            } else {
              markDeviceAccountRegistered();
              setApiError('Account created. Check your email and confirm your account before signing in.');
            }
            return;
          }
        } catch {
          // Keep the existing configured OTP registration path for legacy deployments.
        }

        const response = await registerUser({
          firstName,
          lastName,
          username: username.trim() || firstName.trim() || email.split('@')[0],
          email,
          password,
          gender,
          weight,
          height,
          age,
          governorate: governorate || undefined,
          streakDays: 0,
          signupSource: 'pulsefit-web',
        });

        if (!response.success) {
          throw new Error(response.message || 'Registration could not be completed.');
        }

        if (response.requiresOtp) {
          if (response.user?.id) {
            void notifyTelegramRegistration({ userId: response.user.id, firstName, lastName, email, gender, age, height, weight, governorate: governorate || null }).catch(() => undefined);
          }
          markDeviceAccountRegistered();
          setPendingVerification({
            email: response.email || email,
            userId: response.userId,
            firstName: firstName || response.user?.firstName || 'Athlete',
            lastName: lastName || response.user?.lastName || '',
            isSignup: true,
          });
          setOtpCountdown(60);
          setOtpCode('');
          setApiError(response.message || 'Verification code sent to your email.');
          setIsSubmitting(false);
          return;
        }

        persistAuthSession(response.token);
        markDeviceAccountRegistered();
        setAppMode(gender);
        login(createUserFromResponse(response.user), 'signup');
        return;
      }

      if (email.trim().toLowerCase() === MASTER_ADMIN_EMAIL) {
        try {
          await ensureSupabaseMasterAdminAuth(MASTER_ADMIN_EMAIL, password);
        } catch {
          // The master admin has a separate backend fallback below.
        }

        const adminSignIn = await supabaseSignIn(MASTER_ADMIN_EMAIL, password);
        if (!adminSignIn.error && adminSignIn.data.user) {
          const adminProfile = await ensureMasterAdminProfile(adminSignIn.data.user.id, MASTER_ADMIN_EMAIL);
          login({
            ...mapSupabaseUser(adminSignIn.data.user),
            firstName: adminProfile.first_name || 'Yahia',
            lastName: adminProfile.last_name || 'Awany',
            gender: 'male',
            governorate: 'Alexandria',
            age: 18,
            height: 177,
            weight: 63,
            goal: 'maintenance',
          }, 'login');
          return;
        }

        const adminResponse = await loginUser({ email: MASTER_ADMIN_EMAIL, password });
        if (adminResponse.success) {
          persistAuthSession(adminResponse.token);
          setAppMode('male');
          login(createUserFromResponse({
            ...adminResponse.user,
            firstName: 'Yahia',
            lastName: 'Awany',
            governorate: 'Alexandria',
            gender: 'male',
            age: 18,
            height: 177,
            weight: 63,
          }), 'login');
          return;
        }

        throw new Error(adminSignIn.error ? getSignInErrorMessage(adminSignIn.error) : 'Sign in could not be completed.');
      }

      const supabaseResponse = await supabaseSignIn(email, password);
      if (supabaseResponse.error || !supabaseResponse.data.user) {
        throw new Error(getSignInErrorMessage(supabaseResponse.error || { message: 'Sign in could not be completed.' }));
      }

      login(mapSupabaseUser(supabaseResponse.data.user), 'login');
    } catch (error) {
      if (email.trim().toLowerCase() === MASTER_ADMIN_EMAIL && password === MASTER_ADMIN_PASSWORD) {
        setAppMode('male');
        login(buildOfflineMasterAdminUser(), 'login');
        return;
      }
      const message = error instanceof Error ? error.message : 'Unable to reach the configured backend. Please check your Supabase/API configuration.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!pendingVerification || otpCode.trim().length !== 6) {
      setApiError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setOtpLoading(true);
    setApiError('');

    try {
      const response = await verifyOtp({
        email: pendingVerification.email,
        otp: otpCode,
        userId: pendingVerification.userId,
      });

      if (!response.success) {
        throw new Error(response.message || 'OTP verification failed.');
      }

      persistAuthSession(response.token);
      login(createUserFromResponse(response.user), pendingVerification.isSignup ? 'signup' : 'login');
      setPendingVerification(null);
      setOtpCode('');
      setOtpCountdown(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP verification could not be completed.';
      setApiError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingVerification || otpCountdown > 0 || resendingOtp) {
      return;
    }

    setResendingOtp(true);
    setApiError('');

    try {
      const response = await resendOtp({
        email: pendingVerification.email,
        mode: pendingVerification.isSignup ? 'signup' : 'login',
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to resend the verification code.');
      }

      setOtpCode('');
      setOtpCountdown(60);
          setApiError(response.message || 'A new verification code was sent successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend the verification code.';
      setApiError(message);
    } finally {
      setResendingOtp(false);
    }
  };

  const handleBiometric = async () => {
    setBiometricPulse(true);

    try {
      const biometricState = await requestBiometricPermission();

      if (!biometricState.supported || biometricState.denied) {
        showPermissionAlert(biometricState.message ?? 'Biometric authentication is not available on this device.');
        setBiometricPulse(false);
        return;
      }

      setTimeout(() => {
        setBiometricPulse(false);
        login({ firstName: 'Alex', lastName: 'Morgan', email: 'alex@pulsefit.app' }, 'login');
      }, 1800);
    } catch {
      setBiometricPulse(false);
      showPermissionAlert('Biometric authentication could not be completed. Please use your email instead.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', backgroundImage: 'radial-gradient(circle at top, rgba(6,182,212,0.12), transparent 45%), radial-gradient(circle at bottom, rgba(236,72,153,0.12), transparent 45%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', color: '#ffffff' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 0 30px rgba(6,182,212,0.15)' }}>
            <Dumbbell size={32} style={{ color: '#ffffff' }} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#06b6d4' }}>Pulse</span><span style={{ color: '#ec4899' }}>Fit</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
            {mode === 'login' ? 'Welcome back. Let\'s train.' : 'Begin your transformation.'}
          </p>
        </div>

        {/* Main Card */}
        <div style={{ backgroundColor: 'rgba(18, 18, 23, 0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '22px 16px', boxShadow: '0 25px 50px rgba(0,0,0,0.7), 0 0 30px rgba(139,92,246,0.05)', overflow: 'hidden' }}>
          <button type="button" onClick={toggleLanguage} style={{ display: 'block', marginLeft: 'auto', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 10px', background: 'rgba(255,255,255,0.04)', color: '#d4d4d8', fontSize: '11px', cursor: 'pointer' }}>
            {language === 'en' ? t('Switch to Arabic') : t('Switch to English')}
          </button>
          
          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: '8px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)', padding: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ flex: 1, borderRadius: '10px', padding: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: mode === 'login' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: mode === 'login' ? '#ffffff' : '#a1a1aa', transition: 'all 0.2s' }}
            >
              {t('Sign In')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              style={{ flex: 1, borderRadius: '10px', padding: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', border: 'none', background: mode === 'signup' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', color: mode === 'signup' ? '#ffffff' : '#a1a1aa', transition: 'all 0.2s' }}
            >
              {t('Sign Up')}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ width: '100%', padding: '14px 14px 14px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <DarkSelect label="Governorate" value={governorate} onChange={setGovernorate} options={[{ value: '', label: 'Select your governorate' }, ...egyptianGovernorates.map((item) => ({ value: item, label: item }))]} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '18px' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>Gender</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setGender('male');
                          setAppMode('male');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '12px 10px',
                          borderRadius: '16px',
                          border: gender === 'male' ? '1px solid rgba(34, 211, 238, 0.8)' : '1px solid rgba(255,255,255,0.1)',
                          background: gender === 'male' ? 'rgba(34, 211, 238, 0.12)' : 'rgba(24,24,27,0.6)',
                          color: gender === 'male' ? '#67e8f9' : '#a1a1aa',
                          boxShadow: gender === 'male' ? '0 0 20px rgba(34, 211, 238, 0.22)' : 'none',
                          backdropFilter: 'blur(24px)',
                          WebkitBackdropFilter: 'blur(24px)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontWeight: 700,
                        }}
                      >
                        <Mars size={16} />
                        Male
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setGender('female');
                          setAppMode('female');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '12px 10px',
                          borderRadius: '16px',
                          border: gender === 'female' ? '1px solid rgba(244, 114, 182, 0.8)' : '1px solid rgba(255,255,255,0.1)',
                          background: gender === 'female' ? 'rgba(244, 114, 182, 0.12)' : 'rgba(24,24,27,0.6)',
                          color: gender === 'female' ? '#f9a8d4' : '#a1a1aa',
                          boxShadow: gender === 'female' ? '0 0 20px rgba(236, 72, 153, 0.22)' : 'none',
                          backdropFilter: 'blur(24px)',
                          WebkitBackdropFilter: 'blur(24px)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontWeight: 700,
                        }}
                      >
                        <Venus size={16} />
                        Female
                      </button>
                    </div>
                  </div>
                  <NumberStepper label="Age" value={age} min={10} max={90} onChange={setAge} />
                </div>

                <div className="grid grid-cols-2 gap-4"><NumberStepper label="Weight" value={weight} min={1} max={300} onChange={setWeight} /><NumberStepper label="Height" value={height} min={1} max={250} onChange={setHeight} /></div>
              </>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 14px 14px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '14px 42px 14px 42px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mode === 'login' && (
              <div style={{ textAlign: 'right' }}>
                <button type="button" style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '12px', cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>
            )}

            {apiError && (
              <div style={{ borderRadius: '12px', border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(127,29,29,0.25)', padding: '10px 12px', fontSize: '12px', color: '#fecaca' }}>
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)', color: '#ffffff', fontSize: '15px', fontWeight: 'bold', cursor: isSubmitting ? 'wait' : 'pointer', boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (mode === 'login' ? 'Signing In...' : 'Creating Account...') : mode === 'login' ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Biometric login */}
          <button
            type="button"
            onClick={handleBiometric}
            disabled={biometricPulse}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: '#e4e4e7', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            <Fingerprint size={24} style={{ color: '#06b6d4' }} />
            <span>{biometricPulse ? 'Authenticating...' : 'Login with Biometrics'}</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '24px' }}>
          By continuing, you agree to PulseFit's Terms & Privacy Policy.
        </p>
      </div>

      {pendingVerification && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(14px)', zIndex: 60 }}>
          <div style={{ width: '100%', maxWidth: '420px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(18,18,23,0.85)', padding: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#67e8f9', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Verify Email</div>
                <h3 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>Enter OTP</h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingVerification(null)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.72)', fontSize: '14px' }}>
              A 6-digit verification code was sent to <strong style={{ color: '#ffffff' }}>{pendingVerification.email}</strong>.
            </p>

            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="000000"
                style={{ width: '100%', padding: '16px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '18px', letterSpacing: '0.5rem', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {apiError && (
              <div style={{ marginBottom: '16px', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(127,29,29,0.25)', padding: '10px 12px', fontSize: '12px', color: '#fecaca' }}>
                {apiError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpCountdown > 0 || resendingOtp}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: otpCountdown > 0 ? 'rgba(255,255,255,0.02)' : 'rgba(6,182,212,0.08)',
                  color: otpCountdown > 0 ? 'rgba(255,255,255,0.45)' : '#67e8f9',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: otpCountdown > 0 || resendingOtp ? 'not-allowed' : 'pointer',
                }}
              >
                {resendingOtp ? 'Sending a new code...' : 'Resend code'}
              </button>

              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                {otpCountdown > 0 ? `${otpCountdown}s remaining` : 'You can send a new code now'}
              </div>
            </div>

            <button
              type="button"
              disabled={otpLoading}
              onClick={handleOtpVerification}
              style={{ width: '100%', padding: '15px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)', color: '#ffffff', fontSize: '15px', fontWeight: '700', cursor: otpLoading ? 'wait' : 'pointer', boxShadow: '0 10px 25px rgba(236,72,153,0.25)' }}
            >
                {otpLoading ? 'Verifying...' : 'Verify and continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}