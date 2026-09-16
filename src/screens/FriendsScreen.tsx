import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Check, Flame, Search, Trophy, UserPlus, Users, X, Zap } from 'lucide-react';
import { GlassCard, GlassPanel } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';
import {
  fetchFriends,
  respondToFriendRequest,
  searchFriends,
  sendFriendRequest,
  type FriendProfile,
} from '@/lib/api';

export function FriendsScreen() {
  const { user, setScreen, streakDays, dailyStats, isOffline } = useApp();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendProfile[]>([]);
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFriends = async () => {
    if (!user?.email || isOffline) {
      return;
    }

    try {
      const data = await fetchFriends(user.email);
      setFriends(data.friends);
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch {
      setNotice('مش قادرين نوصل لقائمة الأصحاب دلوقتي. بياناتك المحلية لسه موجودة.');
    }
  };

  useEffect(() => {
    void loadFriends();
  }, [isOffline, user?.email]);

  const handleSearch = async () => {
    if (!user?.email || query.trim().length < 2 || isOffline) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      setResults(await searchFriends(user.email, query.trim()));
    } catch {
      setNotice('البحث محتاج اتصال بالسيرفر. جرّب تاني لما الاتصال يرجع.');
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (friend: FriendProfile) => {
    if (!user?.email) return;
    try {
      const response = await sendFriendRequest(user.email, friend.email);
      setNotice(response.message || 'تم إرسال الطلب.');
      setResults((current) => current.filter((item) => item.email !== friend.email));
      await loadFriends();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'تعذر إرسال الطلب.');
    }
  };

  const respond = async (friend: FriendProfile, accept: boolean) => {
    if (!user?.email || !friend.requestId) return;
    try {
      const response = await respondToFriendRequest(user.email, friend.requestId, accept);
      setNotice(response.message || 'تم تحديث الطلب.');
      await loadFriends();
    } catch {
      setNotice('تعذر تحديث طلب الصداقة.');
    }
  };

  return (
    <div className="min-h-screen px-4 safe-content-bottom pt-6 safe-top">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">Community</span>
            <h1 className="mt-1 font-display text-3xl font-bold text-white">Friends</h1>
          </div>
          <button type="button" onClick={() => setScreen('dashboard')} className="glass-card rounded-2xl p-3 text-white/70 hover:text-neon-cyan" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </button>
        </div>

        {isOffline && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">أنت أوفلاين حالياً. هنرجّع طلبات الأصحاب أول ما الاتصال يرجع.</div>}
        {notice && <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/10 px-3 py-2 text-xs text-neon-cyan">{notice}</div>}

        <GlassPanel className="p-4">
          <div className="flex items-center gap-2">
            <Search size={17} className="text-neon-cyan" />
            <span className="text-sm font-semibold text-white">دَوّر على صاحب</span>
          </div>
          <div className="mt-3 flex gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void handleSearch()} placeholder="username أو email" className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-neon-cyan/50" />
            <button type="button" onClick={() => void handleSearch()} disabled={loading || isOffline} className="rounded-2xl bg-neon-cyan px-4 py-3 text-xs font-bold text-ink-900 disabled:opacity-50">{loading ? '...' : 'Search'}</button>
          </div>
          {results.length > 0 && <div className="mt-3 space-y-2">{results.map((friend) => <div key={friend.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neon-cyan/10 text-neon-cyan"><Users size={17} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-white">{friend.name}</div><div className="truncate text-[10px] text-white/45">@{friend.username}</div></div><button type="button" onClick={() => void sendRequest(friend)} className="rounded-xl border border-neon-green/30 bg-neon-green/10 p-2 text-neon-green" aria-label={`Add ${friend.name}`}><UserPlus size={16} /></button></div>)}</div>}
        </GlassPanel>

        {incoming.length > 0 && <GlassPanel className="p-4"><div className="flex items-center gap-2"><UserPlus size={16} className="text-neon-orange" /><span className="text-sm font-semibold text-white">طلبات جديدة</span></div><div className="mt-3 space-y-2">{incoming.map((friend) => <div key={friend.requestId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white">{friend.name}</div><div className="text-[10px] text-white/45">{friend.streakDays} يوم استمرار</div></div><button type="button" onClick={() => void respond(friend, false)} className="rounded-xl border border-white/10 p-2 text-white/50"><X size={16} /></button><button type="button" onClick={() => void respond(friend, true)} className="rounded-xl border border-neon-green/30 bg-neon-green/10 p-2 text-neon-green"><Check size={16} /></button></div>)}</div></GlassPanel>}

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Trophy size={17} className="text-neon-orange" /><span className="text-sm font-semibold text-white">Buddy Challenge</span></div><span className="text-[10px] uppercase tracking-[0.12em] text-white/40">This week</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><ProgressStat label="Your streak" value={`${streakDays} days`} icon={<Flame size={15} />} /><ProgressStat label="Your steps" value={dailyStats.steps.toLocaleString()} icon={<Zap size={15} />} /></div>
          {friends.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-white/45">ضيف أول صاحب علشان تبدأوا التحدي الأسبوعي.</div> : <div className="mt-4 space-y-2">{friends.map((friend) => <div key={friend.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-semibold text-white">{friend.name}</div><div className="text-[10px] text-white/45">@{friend.username}</div></div><div className="text-right"><div className="text-sm font-bold text-neon-orange">{friend.streakDays} يوم</div><div className="text-[10px] text-white/40">streak</div></div></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-neon-orange to-neon-pink" style={{ width: `${Math.min(100, (friend.streakDays / Math.max(streakDays, friend.streakDays, 1)) * 100)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-white/45"><span>{friend.completedWorkouts} workouts</span><span>{friend.points} points</span></div></div>)}</div>}
        </GlassPanel>
      </div>
    </div>
  );
}

function ProgressStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <GlassCard className="p-3"><div className="flex items-center gap-2 text-neon-cyan">{icon}<span className="text-[10px] uppercase text-white/45">{label}</span></div><div className="mt-2 text-lg font-display font-bold text-white">{value}</div></GlassCard>;
}
