import { useMemo, useState } from 'react';
import { Check, Crown, Sparkles } from 'lucide-react';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useApp } from '@/context/AppContext';
import { isAdminUser } from '@/lib/api';
import type { User } from '@/types';

const TRIAL_DAYS = 15;

export function TrialStatusBadge() {
  const { user, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null;
  }

  const status = getSubscriptionStatus(user);

  if (status.kind === 'hidden') {
    return null;
  }

  const username = `${user.firstName} ${user.lastName}`.trim();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={status.kind === 'pro'
          ? 'inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/50 bg-neon-cyan/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-neon-cyan shadow-[0_0_18px_rgba(34,245,214,0.22)] transition hover:bg-neon-cyan/20'
          : 'inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1.5 text-[10px] font-black tracking-[0.08em] text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.16)] transition hover:bg-amber-500/20'
        }
      >
        {status.kind === 'pro' ? <Crown size={13} /> : <Sparkles size={13} />}
        <span>{status.kind === 'pro' ? 'PRO' : t('Freemium (Trial)')}</span>
        {status.kind === 'trial' && <span className="text-amber-200/80">• {status.days} {t('days')}</span>}
      </button>

      {isOpen && status.kind === 'trial' && (
        <SubscriptionModal email={user.email} username={username} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

function getSubscriptionStatus(user: User): { kind: 'trial' | 'pro' | 'hidden'; days?: number } {
  if (isAdminUser(user) || user.subscriptionStatus === 'active' || user.subscriptionPlan === 'lifetime') {
    return { kind: 'pro' };
  }

  if (user.subscriptionStatus === 'expired') {
    return { kind: 'hidden' };
  }

  const createdAt = user.createdAt ? Date.parse(user.createdAt) : NaN;
  const explicitExpiry = user.subscriptionExpiresAt ? Date.parse(user.subscriptionExpiresAt) : NaN;
  const trialEnd = Number.isFinite(explicitExpiry)
    ? explicitExpiry
    : Number.isFinite(createdAt)
      ? createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000
      : Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const remaining = Math.max(0, trialEnd - Date.now());
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));

  return days > 0 ? { kind: 'trial', days } : { kind: 'hidden' };
}
