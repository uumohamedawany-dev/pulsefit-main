import { useEffect, useMemo, useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DefaultAvatar } from '@/components/DefaultAvatar';
import { GlassPanel } from '@/components/GlassUI';
import { fetchLeaderboardRecords, type LeaderboardRecord } from '@/lib/pocketbase';

function formatCommitment(score: number) {
  return `${score}/100`;
}

export function StreakLeaderboard() {
  const { appMode, user } = useApp();
  const isFemale = appMode === 'female';
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        const leaderboard = await fetchLeaderboardRecords(50);

        if (isMounted) {
          setRecords(leaderboard);
        }
      } catch (error) {
        console.error('Unable to load streak leaderboard from PocketBase:', error);
        if (isMounted) {
          setRecords([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const accent = isFemale
    ? {
        text: 'text-pink-400',
        border: 'border-pink-400/35',
        glow: 'shadow-[0_0_24px_rgba(236,72,153,0.28)]',
        badge: 'border-pink-400/30 bg-pink-500/10 text-pink-100',
        topCard: 'border-pink-400/35 bg-gradient-to-br from-pink-500/15 via-zinc-900/80 to-zinc-900/90',
        header: 'from-pink-500 to-rose-600',
      }
    : {
        text: 'text-cyan-400',
        border: 'border-cyan-400/35',
        glow: 'shadow-[0_0_24px_rgba(34,211,238,0.28)]',
        badge: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
        topCard: 'border-cyan-400/35 bg-gradient-to-br from-cyan-500/15 via-zinc-900/80 to-zinc-900/90',
        header: 'from-cyan-500 to-blue-600',
      };

  const leaderboardData = useMemo(() => {
    const currentUserEmail = user?.email?.trim().toLowerCase();
    const currentUserId = user?.id?.trim();

    return [...records]
      .map((entry) => {
        const entryEmail = String(entry.email || '').trim().toLowerCase();
        const entryUsername = String(entry.username || '').trim().toLowerCase();
        const isCurrentUser = !!(
          (currentUserId && entry.id === currentUserId) ||
          (currentUserEmail && (entryEmail === currentUserEmail || entryUsername === currentUserEmail))
        );

        return {
          ...entry,
          streakDays: Number(entry.streakDays ?? 0),
          streakWeeks: Number(entry.streakWeeks ?? Math.max(0, Math.floor((entry.streakDays ?? 0) / 7))),
          commitmentScore: Math.min(100, Math.max(0, Number(entry.points ?? entry.score ?? 0))),
          isCurrentUser,
        };
      })
      .sort((a, b) => {
        if (b.streakDays !== a.streakDays) {
          return b.streakDays - a.streakDays;
        }

        return Number(b.points ?? b.score ?? 0) - Number(a.points ?? a.score ?? 0);
      });
  }, [records, user?.email, user?.id]);

  const rankedUsers = leaderboardData.map((entry, index) => ({ ...entry, rank: index + 1 }));
  const topThree = rankedUsers.slice(0, 3);
  const rest = rankedUsers.slice(3);
  const currentUserEntry = rankedUsers.find((entry) => entry.isCurrentUser);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '١';
    if (rank === 2) return '٢';
    if (rank === 3) return '٣';
    return `#${rank}`;
  };

  const getRankPillClasses = (rank: number) => {
    if (rank === 1) return 'border-amber-300/40 bg-amber-500/10 text-amber-200';
    if (rank === 2) return 'border-slate-300/40 bg-slate-500/10 text-slate-200';
    if (rank === 3) return 'border-orange-300/40 bg-orange-500/10 text-orange-100';
    return 'border-white/10 bg-white/[0.03] text-white/60';
  };

  return (
    <GlassPanel className="p-5 animate-fade-in-up rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">الاستمرارية</p>
          <h3 className="mt-1 font-display text-2xl font-bold text-white">لوحة الاستمرارية</h3>
        </div>
        <div className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${accent.badge}`}>
          مباشر
        </div>
      </div>

      <div className={`mt-4 rounded-2xl bg-gradient-to-r ${accent.header} p-[1px]`}>
        <div className="rounded-2xl bg-zinc-950/80 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">
            <span className="flex items-center gap-2">
              <Trophy size={12} className={accent.text} />
              المتحمسين الأعلى
            </span>
            <span>مرتب حسب الاستمرارية</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <div className="h-24 animate-pulse rounded-[26px] border border-white/10 bg-white/[0.03]" />
          <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      ) : rankedUsers.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-medium text-white/70">ما فيش بيانات للترتيب لحد دلوقتي.</p>
          <p className="mt-1 text-xs text-white/40">ابدأ بالتدريب علشان يظهر ترتيبك وكمان الاستمرارية.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {topThree.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-[26px] border p-4 ${accent.topCard} ${entry.isCurrentUser ? accent.glow : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getRankPillClasses(entry.rank)}`}>
                    {getRankBadge(entry.rank)}
                  </span>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${accent.badge}`}>
                    {entry.streakDays} أيام
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={`${entry.name} avatar`}
                      className="h-12 w-12 rounded-2xl object-cover border border-white/10"
                    />
                  ) : (
                    <DefaultAvatar gender={appMode} size="sm" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold text-white">{entry.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.1em] text-white/45">{entry.city}</div>
                  </div>
                </div>

                <div className={`mt-4 rounded-2xl border ${accent.border} bg-white/[0.02] p-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">الاستمرارية</span>
                    <span className={`text-sm font-bold ${accent.text}`}>{entry.streakWeeks} أسابيع</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">التزام</span>
                    <span className="text-sm font-bold text-white">{formatCommitment(entry.commitmentScore)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[26px] border border-white/10 bg-zinc-900/50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                <Zap size={13} className={accent.text} />
                الترتيب الكامل
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-white/40">الاستمرارية أولاً</span>
            </div>

            <div className="max-h-[65vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                {rest.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
                      entry.isCurrentUser
                        ? `${accent.border} bg-white/[0.03] ${accent.glow}`
                        : 'border-white/10 bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[11px] font-bold text-white/70">
                      {entry.rank}
                    </div>

                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="shrink-0">
                        {entry.avatar ? (
                          <img
                            src={entry.avatar}
                            alt={`${entry.name} avatar`}
                            className="h-10 w-10 rounded-xl object-cover border border-white/10"
                          />
                        ) : (
                          <DefaultAvatar gender={appMode} size="sm" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-white">{entry.name}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${getRankPillClasses(entry.rank)}`}>
                            {entry.isCurrentUser ? 'أنت' : getRankBadge(entry.rank)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.1em] text-white/45">
                          <span>{entry.city}</span>
                          <span className={accent.text}>{entry.streakDays} أيام</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {currentUserEntry && currentUserEntry.rank > 3 && (
            <div className={`mt-4 rounded-[26px] border p-4 ${accent.border} ${accent.glow} bg-zinc-950/70`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap size={16} className={accent.text} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">مركزك</span>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${accent.badge}`}>
                  #{currentUserEntry.rank}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {currentUserEntry.avatar ? (
                    <img
                      src={currentUserEntry.avatar}
                      alt="Current profile"
                      className="h-12 w-12 rounded-2xl object-cover border border-white/10"
                    />
                  ) : (
                    <DefaultAvatar gender={appMode} size="sm" />
                  )}
                  <div>
                    <div className="text-base font-bold text-white">{currentUserEntry.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.1em] text-white/45">الترتيب الحالي</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-display font-bold ${accent.text}`}>{currentUserEntry.streakDays} أيام</div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-white/40">استمرارية</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </GlassPanel>
  );
}
