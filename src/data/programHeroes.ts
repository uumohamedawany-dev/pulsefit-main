import type { SplitSystem } from '@/data/splitGenerator';

export interface ProgramHero {
  title: string;
  subtitle: string;
  quote: string;
  overlay: string;
  fallback: string;
}

export const programHeroes: Record<SplitSystem, ProgramHero> = {
  BigRamy: {
    title: 'Big Ramy Split',
    subtitle: 'Mass Monster Volume',
    quote: '“Mass is built one rep at a time.” — Big Ramy',
    overlay: 'from-red-950/85 via-black/45 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_20%_20%,rgba(255,59,74,0.35),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(34,245,214,0.12),transparent_40%),linear-gradient(160deg,#1a0508,#06070B)]',
  },
  Arnold: {
    title: 'Arnold Split',
    subtitle: 'Golden Era Density',
    quote: '“The mind can be a powerful ally or a dangerous enemy.” — Arnold Schwarzenegger',
    overlay: 'from-amber-950/80 via-black/40 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_18%_15%,rgba(255,170,60,0.32),transparent_46%),radial-gradient(circle_at_85%_75%,rgba(79,168,255,0.16),transparent_40%),linear-gradient(160deg,#1a1206,#06070B)]',
  },
  PPL: {
    title: 'PPL Elite Flow',
    subtitle: 'Push • Pull • Legs',
    quote: '“Your body achieves what your mind believes.” — Elite Coaching',
    overlay: 'from-cyan-950/80 via-black/40 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_20%_20%,rgba(34,245,214,0.28),transparent_46%),radial-gradient(circle_at_80%_80%,rgba(79,168,255,0.16),transparent_40%),linear-gradient(160deg,#041416,#06070B)]',
  },
  Bro: {
    title: 'Bro Split Flow',
    subtitle: 'One Muscle. Full Focus.',
    quote: '“Train the body you want with the discipline you already have.” — PulseFit',
    overlay: 'from-fuchsia-950/80 via-black/40 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_22%_18%,rgba(255,77,141,0.3),transparent_46%),radial-gradient(circle_at_84%_78%,rgba(168,85,247,0.18),transparent_40%),linear-gradient(160deg,#160610,#06070B)]',
  },
  UpperLower: {
    title: 'Upper / Lower Flow',
    subtitle: 'Balanced Frequency',
    quote: '“Control your body, control your future.” — Elite Coaching',
    overlay: 'from-blue-950/80 via-black/40 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_20%_20%,rgba(79,168,255,0.28),transparent_46%),radial-gradient(circle_at_80%_80%,rgba(57,255,136,0.12),transparent_40%),linear-gradient(160deg,#071018,#06070B)]',
  },
  GluteCoreFocus: {
    title: 'Glute & Core Focus',
    subtitle: 'Lift • Tone • Balance',
    quote: '“Strong glutes create a stronger foundation for every move.” — PulseFit',
    overlay: 'from-pink-950/80 via-fuchsia-950/50 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.34),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.18),transparent_40%),linear-gradient(160deg,#180712,#06070B)]',
  },
  SculptTone: {
    title: 'Sculpt & Tone',
    subtitle: 'Shape with Precision',
    quote: '“Toning is consistency, not perfection.” — PulseFit',
    overlay: 'from-rose-950/85 via-pink-950/55 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_18%_18%,rgba(251,113,133,0.34),transparent_46%),radial-gradient(circle_at_85%_75%,rgba(236,72,153,0.16),transparent_40%),linear-gradient(160deg,#1a0712,#06070B)]',
  },
  HourglassShape: {
    title: 'Hourglass Shape',
    subtitle: 'Curves • Confidence • Balance',
    quote: '“The best curves are built with smart training and patient recovery.” — PulseFit',
    overlay: 'from-rose-900/85 via-fuchsia-900/50 to-ink-900/90',
    fallback: 'bg-[radial-gradient(circle_at_20%_20%,rgba(253,164,175,0.36),transparent_46%),radial-gradient(circle_at_80%_80%,rgba(244,114,182,0.18),transparent_40%),linear-gradient(160deg,#200a10,#06070B)]',
  },
};

export const splitPickerLabel: Record<SplitSystem, string> = {
  BigRamy: 'Big Ramy',
  Arnold: 'Arnold',
  PPL: 'PPL',
  Bro: 'Bro Split',
  UpperLower: 'Upper/Lower',
  GluteCoreFocus: 'Glute & Core',
  SculptTone: 'Sculpt & Tone',
  HourglassShape: 'Hourglass Shape',
};
