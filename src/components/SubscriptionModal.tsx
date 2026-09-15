import { useState, type ChangeEvent } from 'react';
import { Check, Copy, Crown, Upload, X } from 'lucide-react';
import { GlassPanel } from '@/components/GlassUI';
import { submitSubscriptionRequest } from '@/lib/api';
import { createPayment, supabase } from '@/lib/supabaseClient';
import type { SubscriptionPlan } from '@/types';

const plans: Array<{ id: SubscriptionPlan; title: string; price: string; detail: string }> = [
  { id: 'monthly', title: 'الخطة الشهرية', price: '30 جنيه', detail: 'أول شهر، وبعده 50 جنيه / شهر' },
  { id: 'yearly', title: 'الخطة السنوية', price: '300 جنيه', detail: 'اشتراك سنة كاملة' },
  { id: 'lifetime', title: 'الخطة الأبدية', price: '450 جنيه', detail: 'دفع مرة واحدة' },
];

export function SubscriptionModal({ email, username, onClose }: { email: string; username: string; onClose: () => void }) {
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
      setMessage('ارفع صورة واضحة أقل من 7 ميجا.');
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
      setMessage('ارفع صورة التحويل الأول.');
      return;
    }
    setStatus('sending');
    try {
      const response = await submitSubscriptionRequest({ email, username, plan: selectedPlan, receiptDataUrl });
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const amounts = { monthly: 30, yearly: 300, lifetime: 450 } as const;
        await createPayment({
          user_id: authData.user.id,
          email,
          plan: selectedPlan,
          amount: amounts[selectedPlan],
          receipt_data_url: receiptDataUrl,
          status: 'pending',
        });
      }
      setStatus('success');
      setMessage(response.message || 'تم إرسال طلبك للمراجعة بنجاح.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'حصل خطأ، حاول تاني.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <GlassPanel className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto border-neon-cyan/30 p-5">
        <div className="flex items-start justify-between gap-3">
          <div><span className="text-[10px] uppercase tracking-[0.2em] text-neon-cyan">PulseFit Pro</span><h2 className="mt-1 font-display text-2xl font-bold text-white">افتح كل مميزات Pro</h2><p className="mt-1 text-xs text-white/50">اختار خطتك وحوّل على واحدة من طرق الدفع المحلية.</p></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-white/60 hover:text-white"><X size={18} /></button>
        </div>

        {status === 'success' ? (
          <div className="mt-6 rounded-3xl border border-neon-green/30 bg-neon-green/10 p-6 text-center"><Check size={34} className="mx-auto text-neon-green" /><h3 className="mt-3 text-xl font-bold text-white">تمام يا وحش!</h3><p className="mt-2 text-sm leading-6 text-neon-green/90">{message}</p><button type="button" onClick={onClose} className="mt-5 rounded-2xl bg-neon-green px-5 py-3 text-xs font-bold text-ink-900">إغلاق</button></div>
        ) : <>
          <div className="mt-5 space-y-2">{plans.map((plan) => <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedPlan === plan.id ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/10 bg-white/[0.03]'}`}><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-bold text-white">{plan.title}</div><div className="mt-1 text-[11px] text-white/50">{plan.detail}</div></div><div className="text-lg font-display font-bold text-neon-cyan">{plan.price}</div></div></button>)}</div>
          <div className="mt-5 grid grid-cols-2 gap-3"><PaymentNumber label="Vodafone Cash" number="01027815514" copied={copied === 'vodafone'} onCopy={() => void copyNumber('vodafone', '01027815514')} /><PaymentNumber label="InstaPay" number="01271902966" copied={copied === 'instapay'} onCopy={() => void copyNumber('instapay', '01271902966')} /></div>
          <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-neon-cyan/30 bg-neon-cyan/5 p-4 text-center"><Upload size={20} className="mx-auto text-neon-cyan" /><span className="mt-2 block text-sm font-semibold text-white">ارفع صورة التحويل</span><span className="mt-1 block truncate text-[11px] text-white/45">{receiptName || 'PNG / JPG لحد 7 ميجا'}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleReceipt} /></label>
          {message && <div className={`mt-3 rounded-2xl px-3 py-2 text-xs ${status === 'error' ? 'border border-red-400/25 bg-red-500/10 text-red-200' : 'border border-white/10 bg-white/[0.03] text-white/70'}`}>{message}</div>}
          <button type="button" disabled={status === 'sending'} onClick={() => void submit()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-xs font-bold text-ink-900 disabled:opacity-50"><Crown size={15} />{status === 'sending' ? 'جاري إرسال الطلب...' : 'إرسال طلب الاشتراك'}</button>
        </>}
      </GlassPanel>
    </div>
  );
}

function PaymentNumber({ label, number, copied, onCopy }: { label: string; number: string; copied: boolean; onCopy: () => void }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</div><div className="mt-2 flex items-center justify-between gap-2"><span className="text-sm font-bold text-white">{number}</span><button type="button" onClick={onCopy} className="rounded-xl border border-white/10 p-2 text-neon-cyan" aria-label={`Copy ${label} number`}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div></div>;
}
