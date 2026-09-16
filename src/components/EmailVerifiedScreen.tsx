import { CheckCircle2, Dumbbell, ArrowRight } from 'lucide-react';

export function EmailVerifiedScreen({ secondsRemaining, onContinue }: { secondsRemaining: number; onContinue: () => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#06070B] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(57,255,136,0.16),transparent_34%),radial-gradient(circle_at_15%_85%,rgba(34,245,214,0.12),transparent_32%)]" />
      <section className="relative w-full max-w-lg rounded-[2rem] border border-white/20 bg-white/10 p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_55px_rgba(57,255,136,0.1)] backdrop-blur-md sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-neon-green/40 bg-neon-green/10 text-neon-green shadow-[0_0_35px_rgba(57,255,136,0.3)]">
          <CheckCircle2 size={48} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-neon-cyan">
          <Dumbbell size={14} aria-hidden="true" /> PulseFit
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">Email Verified Successfully!</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/65">Your account is now fully active. Welcome to PulseFit, where your next stronger version starts.</p>
        <button type="button" onClick={onContinue} className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-green to-neon-cyan px-6 py-3.5 text-sm font-bold text-ink-900 shadow-[0_0_28px_rgba(57,255,136,0.25)] transition hover:brightness-110">
          Continue to PulseFit <ArrowRight size={16} aria-hidden="true" />
        </button>
        <p className="mt-4 text-xs text-white/40">Taking you to your dashboard in {secondsRemaining}s</p>
      </section>
    </main>
  );
}