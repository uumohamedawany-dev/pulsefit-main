import { useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Crown, Upload, X } from 'lucide-react';
import { GlassPanel } from '@/components/GlassUI';
import { submitSubscriptionRequest } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import { useApp } from '@/context/AppContext';
import type { SubscriptionPlan } from '@/types';

const plans: Array<{ id: SubscriptionPlan; titleKey: string; price: number; detailKey: string }> = [
  { id: 'monthly', titleKey: 'Monthly plan', price: 30, detailKey: 'First month, then 50 EGP / month' },
  { id: 'yearly', titleKey: 'Yearly plan', price: 300, detailKey: 'Full year subscription' },
  { id: 'lifetime', titleKey: 'Lifetime plan', price: 450, detailKey: 'One-time payment' },
];

export function SubscriptionModal({ email, username, onClose }: { email: string; username: string; onClose: () => void }) {
  const { t } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
  const [receiptDataUrl, setReceiptDataUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [copied, setCopied] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const copyNumber = async (label: string, value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const handleReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 7 * 1024 * 1024) {
      setStatus('error');
      setMessage(t('Upload a clear image smaller than 7 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptDataUrl(String(reader.result || ''));
      setReceiptName(file.name);
      setStatus('idle');
      setMessage('');
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!receiptDataUrl) {
      setStatus('error');
      setMessage(t('Upload your transfer screenshot first.'));
      return;
    }
    setStatus('sending');
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        throw new Error(t('Your session expired. Please sign in again.'));
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error(t('Your session expired. Please sign in again.'));
      }
      const response = await submitSubscriptionRequest({ email, username, plan: selectedPlan, receiptDataUrl, accessToken: sessionData.session.access_token });
      if (!response.receiptUrl) {
        throw new Error(t('The payment proof could not be stored. Please try again.'));
      }
      setStatus('success');
      setMessage(response.message || t('Your subscription request was sent successfully.'));
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : t('Something went wrong. Please try again.'));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] h-[100dvh] overflow-hidden overscroll-contain bg-black/90 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,245,214,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(79,168,255,0.1),transparent_32%)]" />
      <button type="button" onClick={onClose} className="fixed right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-black/70 text-white/80 shadow-lg shadow-black/40 backdrop-blur-md transition hover:border-neon-cyan/50 hover:bg-black hover:text-white sm:right-7 sm:top-7" aria-label="إغلاق الاشتراك">
        <X size={22} />
      </button>
      <div className="relative mx-auto flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto rounded-3xl border border-white/10 bg-black/60 p-4 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-6">
        <header className="relative flex flex-col gap-3 border-b border-white/10 pb-6 pr-12">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-neon-cyan">PulseFit Pro</span>
            <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-4xl">{t('Unlock all Pro features')}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{t('Choose a plan, transfer using your preferred local method, and upload the receipt for review.')}</p>
          </div>
        </header>

        {status === 'success' ? (
          <div className="mx-auto my-auto w-full max-w-xl py-12">
            <GlassPanel className="border-neon-green/30 bg-neon-green/10 p-8 text-center sm:p-12">
              <Check size={42} className="mx-auto text-neon-green" />
              <h3 className="mt-5 text-2xl font-bold text-white">{t('All set!')}</h3>
              <p className="mt-3 text-sm leading-7 text-neon-green/90">{message}</p>
              <button type="button" onClick={onClose} className="mt-7 rounded-2xl bg-neon-green px-7 py-3 text-sm font-bold text-ink-900 transition hover:brightness-110">{t('Close')}</button>
            </GlassPanel>
          </div>
        ) : (
          <div className="relative flex flex-col gap-6">
            <GlassPanel className="relative border-white/15 bg-white/10 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neon-cyan">01 / {t('Plan')}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{t('Choose your subscription')}</h3>
                </div>
                <Crown size={22} className="text-neon-cyan" />
              </div>
              <div className="relative flex flex-col gap-3">
                {plans.map((plan) => (
                  <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className={`relative w-full rounded-2xl border p-4 text-right transition ${selectedPlan === plan.id ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_24px_rgba(34,245,214,0.12)]' : 'border-white/10 bg-black/10 hover:border-white/25 hover:bg-white/[0.06]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div><div className="text-sm font-bold text-white">{t(plan.titleKey)}</div><div className="mt-1 text-[11px] leading-5 text-white/50">{t(plan.detailKey)}</div></div>
                      <div className="shrink-0 text-lg font-display font-bold text-neon-cyan">{plan.price} {t('EGP')}</div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassPanel>

            <div className="relative flex flex-col gap-6">
              <GlassPanel className="relative border-white/15 bg-white/10 p-5 sm:p-7">
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neon-cyan">02 / {t('Transfer')}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{t('Transfer using any method')}</h3>
                  <p className="mt-1 text-xs leading-5 text-white/50">{t('Use the amount shown in your selected plan.')}</p>
                </div>
                <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2">
                  <PaymentNumber label="Vodafone Cash" number="01027815514" copied={copied === 'vodafone'} onCopy={() => void copyNumber('vodafone', '01027815514')} />
                  <PaymentNumber label="InstaPay" number="01271902966" copied={copied === 'instapay'} onCopy={() => void copyNumber('instapay', '01271902966')} />
                </div>
              </GlassPanel>

              <GlassPanel className="relative border-white/15 bg-white/10 p-5 sm:p-7">
                <div className="mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neon-cyan">03 / {t('Proof')}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{t('Upload your transfer screenshot')}</h3>
                </div>
                <label className="relative flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neon-cyan/40 bg-neon-cyan/5 px-4 py-6 text-center transition hover:bg-neon-cyan/10">
                  <Upload size={24} className="text-neon-cyan" />
                  <span className="mt-3 text-sm font-semibold text-white">{t('Choose a clear image')}</span>
                  <span className="mt-1 max-w-full truncate text-[11px] text-white/45">{receiptName || t('PNG / JPG / WEBP up to 7 MB')}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleReceipt} />
                </label>
                {message && <div className={`mt-4 rounded-2xl px-4 py-3 text-xs leading-5 ${status === 'error' ? 'border border-red-400/25 bg-red-500/10 text-red-200' : 'border border-white/10 bg-white/[0.03] text-white/70'}`}>{message}</div>}
                <button type="button" disabled={status === 'sending'} onClick={() => void submit()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-4 text-sm font-bold text-ink-900 shadow-[0_0_28px_rgba(34,245,214,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Crown size={16} />{status === 'sending' ? t('Sending request...') : t('Submit subscription request')}</button>
              </GlassPanel>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function PaymentNumber({ label, number, copied, onCopy }: { label: string; number: string; copied: boolean; onCopy: () => void }) {
  return <div className="relative min-w-0 rounded-2xl border border-white/10 bg-black/10 p-4"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">{label}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="break-all font-mono text-sm font-bold tracking-wider text-white md:text-base">{number}</span><button type="button" onClick={onCopy} className="relative ml-auto shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-neon-cyan transition hover:border-neon-cyan/40 hover:bg-neon-cyan/10" aria-label={`Copy ${label} number`}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div><p className="mt-2 text-[10px] text-white/40">{copied ? 'تم النسخ' : 'اضغط لنسخ الرقم'}</p></div>;
}
