import { LogOut, Bell, Shield, HelpCircle, ChevronRight, Target, Award, Flame, Clock, Dumbbell, Edit3, Scale, TrendingDown, Activity, Plus, X, HeartPulse, Fingerprint, Lock, FileText, Send, Info } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '@/context/AppContext';
import { GlassPanel, GlassCard, ToggleSwitch, NeonButton } from '@/components/GlassUI';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import { useRef, useState, type FormEvent } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { saveBodyMeasurement, submitDeveloperContact } from '@/lib/api';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { InBodyRecord, InBodyRecordInput } from '@/types';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { ProGate } from '@/components/ProGate';
import { isAdminUser } from '@/lib/api';

export function ProfileScreen() {
  const { user, logout, theme, inBodyRecords, addInBodyRecord, appMode, setAppMode, onboardingProfile, securitySettings, updateSecuritySettings, dailyStats, streakDays, setScreen, toggleLanguage, language, t } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { requestMediaPermission, showPermissionAlert } = usePermissions();
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [isAppInfoOpen, setIsAppInfoOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [form, setForm] = useState<InBodyRecordInput>({
    date: new Date().toISOString().slice(0, 10),
    weight: 75,
    bodyFatPercentage: 18,
    muscleMass: 34,
    waist: 82,
    chest: 98,
    arms: 34,
    notes: '',
  });
  const [measurementPhoto, setMeasurementPhoto] = useState('');

  const sortedRecords = [...inBodyRecords].sort((a, b) => b.date.localeCompare(a.date));
  const currentWeight = onboardingProfile?.weight ?? 75;

  const handleVersionTap = async () => {
    if (!isAdminUser(user)) {
      setVersionTaps(0);
      return;
    }

    const nextTaps = versionTaps + 1;
    setVersionTaps(nextTaps >= 7 ? 0 : nextTaps);

    if (nextTaps >= 7) {
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch {
        // Haptics are optional on web and unsupported devices.
      }
      setScreen('admin');
    }
  };

  const handleProfileImageRequest = () => {
    const mediaState = requestMediaPermission(fileInputRef.current, {
      accept: 'image/*',
      capture: 'environment',
    });

    if (!mediaState.supported || mediaState.denied) {
      showPermissionAlert(mediaState.message ?? 'Camera or photo access is unavailable right now.');
    }
  };

  const handleProfileImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];

    if (!imageFile) {
      return;
    }

    if (!imageFile.type.startsWith('image/')) {
      showPermissionAlert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    console.log('Profile image selected', previewUrl);
    event.target.value = '';
  };
  const targetWeight = appMode === 'female' ? Math.max(50, currentWeight - 4) : Math.max(50, currentWeight - 2);
  const targetProgress = Math.min(100, Math.max(18, Math.round(((currentWeight - targetWeight) / Math.max(1, currentWeight)) * 100 + 42)));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const weight = Number(form.weight);
    const bodyFat = Number(form.bodyFatPercentage);
    const muscleMass = form.muscleMass == null ? undefined : Number(form.muscleMass);

    if (!Number.isFinite(weight) || weight <= 0) {
      setRecordError('Weight must be greater than 0.');
      return;
    }

    if (!Number.isFinite(bodyFat) || bodyFat < 0 || bodyFat > 100) {
      setRecordError('Body fat must be between 0 and 100%.');
      return;
    }

    if (muscleMass !== undefined && (!Number.isFinite(muscleMass) || muscleMass < 0)) {
      setRecordError('Skeletal muscle mass must be a positive number.');
      return;
    }

    addInBodyRecord({
      date: form.date || new Date().toISOString(),
      weight,
      bodyFatPercentage: bodyFat,
      muscleMass,
      waist: Number(form.waist) > 0 ? Number(form.waist) : undefined,
      chest: Number(form.chest) > 0 ? Number(form.chest) : undefined,
      arms: Number(form.arms) > 0 ? Number(form.arms) : undefined,
      photoDataUrl: measurementPhoto || undefined,
      notes: form.notes?.trim(),
    });
    if (user?.email) {
      void saveBodyMeasurement({
        email: user.email,
        date: form.date || new Date().toISOString(),
        weight,
        bodyFatPercentage: bodyFat,
        muscleMass,
        waist: Number(form.waist) > 0 ? Number(form.waist) : undefined,
        chest: Number(form.chest) > 0 ? Number(form.chest) : undefined,
        arms: Number(form.arms) > 0 ? Number(form.arms) : undefined,
        photoDataUrl: measurementPhoto || undefined,
        notes: form.notes?.trim(),
      });
    }

    setRecordError(null);
    setIsFormOpen(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      weight: weight,
      bodyFatPercentage: bodyFat,
      muscleMass,
      waist: Number(form.waist) || undefined,
      chest: Number(form.chest) || undefined,
      arms: Number(form.arms) || undefined,
      notes: '',
    });
    setMeasurementPhoto('');
  };

  const captureMeasurementPhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 72,
        width: 1200,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        saveToGallery: false,
      });
      if (photo.dataUrl) setMeasurementPhoto(photo.dataUrl);
    } catch {
      showPermissionAlert('Camera or photo access is unavailable. Please check your permissions.');
    }
  };

  const handleExportProgressPdf = async () => {
    try {
      setIsExportingPdf(true);
      const doc = new jsPDF();
      const now = new Date().toLocaleString();
      const safeName = `${user?.firstName ?? 'PulseFit'} ${user?.lastName ?? 'User'}`.trim();

      doc.setFillColor(9, 14, 25);
      doc.rect(0, 0, 210, 297, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('PulseFit Progress Report', 14, 24);
      doc.setFontSize(11);
      doc.setTextColor(180, 198, 214);
      doc.text(`Generated: ${now}`, 14, 34);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(`Athlete: ${safeName}`, 14, 52);
      doc.text(`Email: ${user?.email ?? 'Not provided'}`, 14, 60);
      doc.text(`Current streak: ${streakDays} days`, 14, 68);
      doc.text(`App mode: ${appMode}`, 14, 76);
      doc.text(`Goal: ${onboardingProfile?.goal ?? 'maintenance'}`, 14, 84);
      doc.text(`Current weight: ${currentWeight} kg`, 14, 92);
      doc.text(`Target weight: ${targetWeight.toFixed(0)} kg`, 14, 100);

      doc.setDrawColor(85, 212, 225);
      doc.setLineWidth(0.5);
      doc.line(14, 112, 196, 112);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(118, 244, 220);
      doc.text('Daily Stats', 14, 124);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(`Calories: ${dailyStats.caloriesConsumed}/${dailyStats.caloriesGoal} kcal`, 14, 132);
      doc.text(`Protein: ${dailyStats.proteinConsumed}/${dailyStats.proteinGoal} g`, 14, 140);
      doc.text(`Carbs: ${dailyStats.carbsConsumed}/${dailyStats.carbsGoal} g`, 14, 148);
      doc.text(`Fat: ${dailyStats.fatConsumed}/${dailyStats.fatGoal} g`, 14, 156);
      doc.text(`Water: ${dailyStats.waterConsumed}/${dailyStats.waterGoal} ml`, 14, 164);
      doc.text(`Steps: ${dailyStats.steps}/${dailyStats.stepsGoal}`, 14, 172);
      doc.text(`Sleep: ${dailyStats.sleepHours}h ${dailyStats.sleepMinutes % 60}m`, 14, 180);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 195, 138);
      doc.text('Recent InBody Records', 14, 196);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);

      const recentRecords = sortedRecords.slice(0, 4);
      recentRecords.forEach((record, index) => {
        const y = 204 + index * 14;
        const dateLabel = new Date(record.date).toLocaleDateString();
        doc.text(`${dateLabel}: ${record.weight} kg, ${record.bodyFatPercentage}% body fat`, 14, y);
      });

      const fileName = `pulsefit-progress-${(user?.email || 'athlete').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      if (Capacitor.isNativePlatform()) {
        await Filesystem.requestPermissions();
        const dataUri = doc.output('datauristring');
        await Filesystem.writeFile({
          path: fileName,
          data: dataUri.split(',')[1] || '',
          directory: Directory.Documents,
          recursive: true,
        });
      } else {
        doc.save(fileName);
      }
    } catch {
      showPermissionAlert('Unable to generate the PDF report on this device.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleContactSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const message = contactForm.message.trim();
    if (!message) {
      setContactError('Please write a message before sending.');
      return;
    }

    try {
      setContactError(null);
      setContactSuccess(null);
      setIsSendingContact(true);
      const response = await submitDeveloperContact({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message,
        platform: 'pulsefit-web',
      });

      setContactSuccess(response.message || 'Your message was sent successfully.');
      setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      setContactError(message);
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-6 safe-top">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="animate-fade-in-down">
          <h1 className="font-display text-2xl font-bold text-white">Profile</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <GlassPanel className="p-6 flex flex-col items-center animate-scale-in">
          <div className="relative">
            {user?.avatar || user?.profilePicture ? (
              <img
                src={user.avatar ?? user.profilePicture ?? undefined}
                alt={`${user?.firstName ?? 'User'} avatar`}
                className="w-24 h-24 rounded-3xl object-cover border border-white/10"
              />
            ) : (
              <DefaultAvatar gender={appMode} size="lg" />
            )}
            <button
              type="button"
              onClick={handleProfileImageRequest}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-ink-700 border border-white/10 flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            >
              <Edit3 size={14} className="text-white/60" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleProfileImageSelection}
            />
          </div>
          <h2 className="font-display text-xl font-bold text-white mt-4">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-sm text-white/40 mt-1">{user?.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <button type="button" onClick={() => setSubscriptionOpen(true)} className="text-xs font-medium px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 transition hover:bg-neon-cyan/20">
              Pro Member
            </button>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/[0.05] text-white/50 border border-white/[0.08]">
              12-week streak
            </span>
          </div>
        </GlassPanel>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
          <StatCard icon={Flame} label="Streak" value="42" sub="days" color="neon-orange" />
          <StatCard icon={Dumbbell} label="Workouts" value="186" sub="total" color="neon-cyan" />
          <StatCard icon={Award} label="Goals" value="8" sub="hit" color="neon-green" />
        </div>

        {/* Fitness goals */}
        <ProGate feature="Measurement history and progress photos"><GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-neon-cyan" />
            <span className="text-sm font-semibold text-white">Fitness Goals</span>
          </div>
          <div className="space-y-3">
            <GoalRow label="Weight Target" value={`${targetWeight.toFixed(0)} kg`} progress={targetProgress} accent={appMode === 'female' ? 'pink' : 'cyan'} />
            <GoalRow label="Body Fat" value={`${Math.max(10, Math.min(30, 18 + (appMode === 'female' ? -2 : 0)))}%`} progress={45} accent={appMode === 'female' ? 'pink' : 'cyan'} />
            <GoalRow label="Weekly Workouts" value="5x" progress={80} accent={appMode === 'female' ? 'pink' : 'cyan'} />
          </div>
        </GlassPanel></ProGate>

        <GlassPanel className="p-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-neon-cyan" />
              <span className="text-sm font-semibold text-white">InBody & Body Fat</span>
            </div>
            <button type="button" onClick={() => setIsFormOpen(true)} className="rounded-2xl bg-white/[0.07] p-2 text-white/70 hover:text-neon-cyan transition-colors">
              <Plus size={16} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {sortedRecords.map((record) => (
              <InBodyCard key={record.id} record={record} />
            ))}
          </div>
        </GlassPanel>

        {/* Settings */}
        <div className="animate-fade-in-up">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-white">{t('Settings')}</h2>
            <button type="button" onClick={toggleLanguage} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-white">
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
          <GlassPanel className="divide-y divide-white/[0.04] overflow-hidden">
            <SettingsToggle
              icon={Bell}
              label={t('Push Notifications')}
              description="Workout & meal reminders"
              checked={notifications}
              onChange={setNotifications}
            />
            <SettingsToggle
              icon={Shield}
              label={t('Privacy Mode')}
              description="Hide profile from others"
              checked={privacyMode}
              onChange={setPrivacyMode}
            />
            <SettingsToggle
              icon={HeartPulse}
              label={t('Female Mode')}
              description="Pink liquid-glass cycle mode"
              checked={appMode === 'female'}
              onChange={(checked) => setAppMode(checked ? 'female' : 'male')}
            />
            <div className="px-4 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Shield size={16} className="text-neon-cyan" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{t('Security')}</span>
              </div>
              <div className="space-y-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
                <SettingsToggle
                  icon={Fingerprint}
                  label="Biometric Login"
                  description="Use Face ID / Fingerprint to unlock PulseFit"
                  checked={securitySettings.biometricLoginEnabled}
                  onChange={(checked) => updateSecuritySettings({ ...securitySettings, biometricLoginEnabled: checked })}
                />
                <SettingsToggle
                  icon={Lock}
                  label="App Lock"
                  description="Require biometric or device unlock when the app resumes"
                  checked={securitySettings.appLockEnabled}
                  onChange={(checked) => updateSecuritySettings({ ...securitySettings, appLockEnabled: checked })}
                />
              </div>
            </div>
            <SettingsLink icon={FileText} label="Export Progress to PDF" onClick={handleExportProgressPdf} />
            <SettingsLink icon={Info} label="App Info" onClick={() => setIsAppInfoOpen(true)} />
            <SettingsLink icon={Send} label="Contact Developer" onClick={() => setIsContactOpen(true)} />
            <SettingsLink icon={HelpCircle} label="Help & Support" />
            <SettingsLink icon={Clock} label="Workout History" />
          </GlassPanel>
        </div>

        {/* Logout */}
        <div className="animate-fade-in-up pt-2">
          <NeonButton variant="secondary" onClick={logout}>
            <span className="flex items-center justify-center gap-2 text-neon-pink">
              <LogOut size={18} />
              Sign Out
            </span>
          </NeonButton>
        </div>

      </div>

      {isAppInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAppInfoOpen(false)} />
          <GlassPanel className="relative w-full max-w-sm p-6 text-center">
            <button type="button" onClick={() => setIsAppInfoOpen(false)} className="absolute right-3 top-3 rounded-full p-2 text-white/60 hover:text-white" aria-label="Close App Info">
              <X size={18} />
            </button>
            <Info size={24} className="mx-auto text-neon-cyan" />
            <h3 className="mt-3 font-display text-2xl font-bold text-white">App Info</h3>
            <p className="mt-2 text-sm text-white/55">Developer</p>
            <p className="text-base font-semibold text-white">yahiaawany</p>
            <button type="button" onClick={() => void handleVersionTap()} className="mx-auto mt-5 block rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/75 transition hover:border-cyan-300/40 hover:text-white" aria-label="Application version">
              v1
            </button>
          </GlassPanel>
        </div>
      )}

      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsContactOpen(false)} />
          <div className="relative w-full max-w-md">
            <GlassPanel className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">Support</span>
                  <h3 className="font-display text-2xl font-bold text-white mt-1">Contact Developer</h3>
                </div>
                <button type="button" onClick={() => setIsContactOpen(false)} className="rounded-full p-2 text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleContactSubmit}>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Name</label>
                  <input type="text" value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} placeholder="Optional" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Email</label>
                  <input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} placeholder="Optional" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Message</label>
                  <textarea value={contactForm.message} onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none resize-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} rows={5} placeholder="Tell us what you need help with" required />
                </div>

                {contactError && <p className="text-[11px] font-semibold text-red-300">{contactError}</p>}
                {contactSuccess && <p className="text-[11px] font-semibold text-neon-green">{contactSuccess}</p>}

                <button type="submit" disabled={isSendingContact} className="w-full rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-[11px] font-bold uppercase text-ink-900 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70">
                  <span className="inline-flex items-center justify-center gap-2">
                    {isSendingContact ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-900/40 border-t-ink-900" /> : <Send size={15} />}
                    {isSendingContact ? 'Sending...' : 'Send'}
                  </span>
                </button>
              </form>
            </GlassPanel>
          </div>
        </div>
      )}

      {subscriptionOpen && user?.email && <SubscriptionModal email={user.email} username={`${user.firstName} ${user.lastName}`.trim()} onClose={() => setSubscriptionOpen(false)} />}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md">
            <GlassPanel className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">Progress</span>
                  <h3 className="font-display text-2xl font-bold text-white mt-1">InBody Log</h3>
                </div>
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full p-2 text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Date</label>
                  <input type="date" value={form.date || ''} onChange={(event) => setForm({ ...form, date: event.target.value })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Weight (kg)</label>
                    <input type="number" min="1" value={form.weight || ''} onChange={(event) => setForm({ ...form, weight: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Body Fat (%)</label>
                    <input type="number" min="0" max="100" value={form.bodyFatPercentage || ''} onChange={(event) => setForm({ ...form, bodyFatPercentage: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div><label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Waist (cm)</label><input type="number" min="1" value={form.waist || ''} onChange={(event) => setForm({ ...form, waist: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} /></div>
                    <div><label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Chest (cm)</label><input type="number" min="1" value={form.chest || ''} onChange={(event) => setForm({ ...form, chest: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} /></div>
                    <div><label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Arms (cm)</label><input type="number" min="1" value={form.arms || ''} onChange={(event) => setForm({ ...form, arms: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} /></div>
                </div>
                <div className="rounded-2xl border border-dashed border-neon-cyan/30 bg-neon-cyan/5 p-4">
                    <div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-white">Progress photo</div><div className="mt-1 text-[11px] text-white/45">Save a weekly or monthly photo for comparison</div></div><button type="button" onClick={() => void captureMeasurementPhoto()} className="rounded-xl bg-neon-cyan px-3 py-2 text-[10px] font-bold text-ink-900">Choose photo</button></div>
                    {measurementPhoto && <img src={measurementPhoto} alt="Progress photo" className="mt-3 h-32 w-full rounded-2xl object-cover" />}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Skeletal Muscle Mass (kg)</label>
                  <input type="number" min="0" value={form.muscleMass || ''} onChange={(event) => setForm({ ...form, muscleMass: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Notes</label>
                  <textarea value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none resize-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-white/10 bg-white/[0.04] text-white'} focus:border-neon-cyan/60`} rows={3} />
                </div>

                {recordError && <p className="text-[11px] font-semibold text-red-300">{recordError}</p>}

                <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-[11px] font-bold uppercase text-ink-900 transition hover:scale-[1.02]">
                  <span className="inline-flex items-center justify-center gap-2"><Activity size={15} /> Add Record</span>
                </button>
              </form>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}

function InBodyCard({ record }: { record: InBodyRecord }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-neon-green" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-white/50">{new Date(record.date).toLocaleDateString()}</span>
        </div>
        <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-bold uppercase text-white/50">{record.bodyFatPercentage}% fat</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/40"><Scale size={12} /> Weight</div>
          <div className="mt-1 text-sm font-bold text-white">{record.weight} kg</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/40"><TrendingDown size={12} /> Fat</div>
          <div className="mt-1 text-sm font-bold text-neon-orange">{record.bodyFatPercentage}%</div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase text-white/40"><Dumbbell size={12} /> Muscle</div>
          <div className="mt-1 text-sm font-bold text-neon-cyan">{record.muscleMass ?? '-'} kg</div>
        </div>
      </div>
              {(record.waist || record.chest || record.arms) && <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-white/55"><span>Waist {record.waist ?? '-'} cm</span><span>Chest {record.chest ?? '-'} cm</span><span>Arms {record.arms ?? '-'} cm</span></div>}
              {record.photoDataUrl && <img src={record.photoDataUrl} alt="Progress photo" className="mt-3 h-40 w-full rounded-2xl object-cover" />}
      {record.notes && <p className="mt-3 text-[11px] leading-5 text-white/50">{record.notes}</p>}
    </GlassCard>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Flame; label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    'neon-orange': 'text-neon-orange',
    'neon-cyan': 'text-neon-cyan',
    'neon-green': 'text-neon-green',
  };
  return (
    <GlassCard className="p-4 flex flex-col items-center text-center">
      <div className={`w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-2`}>
        <Icon size={18} className={colorMap[color]} />
      </div>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </GlassCard>
  );
}

function GoalRow({ label, value, progress, accent = 'cyan' }: { label: string; value: string; progress: number; accent?: 'cyan' | 'pink' }) {
  const accentStyles = accent === 'pink'
    ? {
        bar: 'bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400',
        glow: '0 0 12px rgba(244,114,182,0.35)',
      }
    : {
        bar: 'bg-gradient-to-r from-neon-cyan to-neon-blue',
        glow: '0 0 12px rgba(34,245,214,0.3)',
      };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-white/50 font-medium">{label}</span>
        <span className="text-xs text-white/70 font-semibold">{value}</span>
      </div>
      <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${accentStyles.bar}`}
          style={{ width: `${progress}%`, boxShadow: accentStyles.glow }}
        />
      </div>
    </div>
  );
}

function SettingsToggle({ icon: Icon, label, description, checked, onChange }: {
  icon: typeof Bell;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-white/50" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <p className="text-xs text-white/30 mt-0.5">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function SettingsLink({ icon: Icon, label, onClick }: { icon: typeof Bell; label: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-white/50" />
      </div>
      <span className="flex-1 text-left text-sm font-medium text-white">{label}</span>
      <ChevronRight size={18} className="text-white/20" />
    </button>
  );
}
