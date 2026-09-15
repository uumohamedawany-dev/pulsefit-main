import { useState, type ReactNode } from 'react';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { GlassPanel } from '@/components/GlassUI';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useApp } from '@/context/AppContext';
import { isProUser } from '@/lib/access';

export function ProGate({ feature, children }: { feature: string; children: ReactNode }) {
  const { user } = useApp();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (isProUser(user)) {
    return <>{children}</>;
  }

  return (
    <>
      <GlassPanel className="relative overflow-hidden border-amber-300/25 p-5">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-500/10 text-amber-200"><LockKeyhole size={18} /></div>
          <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><Sparkles size={14} className="text-amber-200" /><span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Pro Feature</span></div><h3 className="mt-1 text-lg font-bold text-white">{feature}</h3><p className="mt-2 text-sm leading-6 text-white/60">الميزة دي متاحة لمشتركي Pro. افتح خطتك واستمتع بكل أدوات PulseFit المتقدمة.</p><button type="button" onClick={() => setUpgradeOpen(true)} className="mt-4 rounded-2xl bg-gradient-to-r from-amber-300 to-neon-orange px-4 py-3 text-[11px] font-black text-ink-900">افتح Pro دلوقتي</button></div>
        </div>
      </GlassPanel>
      {upgradeOpen && user?.email && <SubscriptionModal email={user.email} username={`${user.firstName} ${user.lastName}`.trim()} onClose={() => setUpgradeOpen(false)} />}
    </>
  );
}
