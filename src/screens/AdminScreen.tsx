import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, BarChart3, Clock3, Flame, RefreshCw, ShieldCheck, Trash2, Users, WifiOff, PencilLine, Ban, CheckCircle2, ScanLine, MessageSquare, Send } from 'lucide-react';
import { GlassCard, GlassPanel } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';
import { broadcastAdminAnnouncement, deleteAdminUser, fetchAdminStats, fetchAdminUsers, fetchSubscriptionRequests, getAdminEmail, grantSubscription, isAdminUser, reviewSubscriptionRequest, sendAdminDirectMessage, updateAdminUser, type AdminStats, type AdminUserRecord, type AdminUserUpdatePayload, type SubscriptionRequest } from '@/lib/api';

export function AdminScreen() {
  const { user, setScreen } = useApp();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string>('Never');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminUserUpdatePayload>({});
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [directUserId, setDirectUserId] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [directStatus, setDirectStatus] = useState('');

  const isAdmin = isAdminUser(user);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [usersResponse, statsResponse, subscriptionsResponse] = await Promise.all([fetchAdminUsers(), fetchAdminStats(), fetchSubscriptionRequests()]);
      setUsers(usersResponse ?? []);
      setStats(statsResponse ?? {});
      setSubscriptionRequests(subscriptionsResponse ?? []);
      setLastUpdated(new Date().toLocaleString());
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to reach the configured admin backend.';
      setError(message);
      setUsers([]);
      setStats({});
      setLastUpdated('Offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const userCount = users.length;
  const avgStreak = users.length
    ? Math.round(users.reduce((sum, userItem) => sum + Number(userItem.streakDays ?? 0), 0) / users.length)
    : 0;

  const todayRegistrations = stats.todayRegistrations ?? users.length;
  const activityLogs = useMemo(() => stats.activityLogs ?? [], [stats]);
  const governorateAnalytics = stats.governorateAnalytics ?? [];
  const genderAnalytics = stats.genderAnalytics ?? { male: { count: 0, percentage: 0 }, female: { count: 0, percentage: 0 } };
  const userGrowthAnalytics = stats.userGrowthAnalytics ?? [];
  const maxGrowth = Math.max(1, ...userGrowthAnalytics.map((entry) => entry.newUsers));

  const handleDeleteUser = async (userId: string) => {
    setActionBusyId(userId);

    try {
      await deleteAdminUser(userId);
      setUsers((current) => current.filter((item) => (item.id ?? item.email) !== userId && (item.id ?? item.email) !== userId));
      setPendingDeleteId(null);
      await loadData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to delete this user.';
      setError(message);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleSaveUser = async (userId: string) => {
    setActionBusyId(userId);

    try {
      await updateAdminUser(userId, editDraft);
      setEditingId(null);
      setEditDraft({});
      await loadData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to update this user.';
      setError(message);
    } finally {
      setActionBusyId(null);
    }
  };

  const toggleUserStatus = async (userItem: AdminUserRecord) => {
    const nextStatus = userItem.status === 'suspended' || userItem.isSuspended ? 'active' : 'suspended';
    setActionBusyId(userItem.id ?? userItem.email ?? '');

    try {
      await updateAdminUser(userItem.id ?? userItem.email ?? '', {
        status: nextStatus,
        isActive: nextStatus === 'active',
        isSuspended: nextStatus === 'suspended',
      });
      await loadData();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to change this user status.';
      setError(message);
    } finally {
      setActionBusyId(null);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setBroadcastStatus('جاري الإرسال...');
    try {
      const response = await broadcastAdminAnnouncement(broadcastText.trim());
      setBroadcastStatus(`${response.message || 'تم الإرسال.'} (${response.delivered ?? 0} مستخدم)`);
      setBroadcastText('');
      await loadData();
    } catch (caughtError) {
      setBroadcastStatus(caughtError instanceof Error ? caughtError.message : 'تعذر إرسال الإعلان.');
    }
  };

  const reviewSubscription = async (request: SubscriptionRequest, action: 'approve' | 'decline') => {
    try {
      await reviewSubscriptionRequest(request.id, action);
      setSubscriptionStatus(action === 'approve' ? 'تم قبول الطلب وتفعيل Pro.' : 'تم رفض الطلب.');
      await loadData();
    } catch (caughtError) {
      setSubscriptionStatus(caughtError instanceof Error ? caughtError.message : 'تعذر تحديث الطلب.');
    }
  };

  const grantPro = async () => {
    if (!grantEmail.trim()) return;
    try {
      const response = await grantSubscription(grantEmail.trim(), grantPlan);
      setSubscriptionStatus(response.message || 'تم التفعيل.');
      setGrantEmail('');
      await loadData();
    } catch (caughtError) {
      setSubscriptionStatus(caughtError instanceof Error ? caughtError.message : 'تعذر تفعيل Pro.');
    }
  };

  const sendDirectMessage = async () => {
    if (!directUserId.trim() || !directMessage.trim()) return;
    setDirectStatus('جاري الإرسال...');
    try {
      const response = await sendAdminDirectMessage(directUserId.trim(), directMessage.trim());
      setDirectStatus(response.message || 'تم إرسال الرسالة.');
      setDirectMessage('');
    } catch (caughtError) {
      setDirectStatus(caughtError instanceof Error ? caughtError.message : 'تعذر إرسال الرسالة.');
    }
  };

  const statCards = [
    {
      label: 'Total Users',
      value: String(stats.totalUsers ?? userCount),
      icon: Users,
      accent: 'text-cyan-300',
    },
    {
      label: 'Active Streaks',
      value: String(stats.activeUsers ?? Math.max(0, userCount - 1)),
      icon: Activity,
      accent: 'text-violet-300',
    },
    {
      label: 'Avg Streak',
      value: `${stats.avgStreakDays ?? avgStreak} days`,
      icon: Flame,
      accent: 'text-pink-300',
    },
    {
      label: 'Today Registrations',
      value: String(todayRegistrations),
      icon: ShieldCheck,
      accent: 'text-emerald-300',
    },
    { label: 'AI Meal Scans', value: String(stats.scannedMeals ?? 0), icon: ScanLine, accent: 'text-amber-300' },
    { label: 'Feedback / Telegram', value: String(stats.feedbackLogs ?? 0), icon: MessageSquare, accent: 'text-rose-300' },
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen px-4 py-6">
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-white">
          <h1 className="text-2xl font-bold">Admin access denied</h1>
          <p className="mt-2 text-sm text-white/70">
            This panel is restricted to the designated PulseFit administrator account ({getAdminEmail()}).
          </p>
          <button
            type="button"
            onClick={() => setScreen('dashboard')}
            className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-28 pt-6 safe-top">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">PulseFit admin</p>
            <h1 className="mt-1 text-3xl font-display font-bold text-white">Secure Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setScreen('dashboard')}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200"
            >
              <ArrowLeft size={14} />
              Dashboard
            </button>
          </div>
        </div>

        {error && (
          <GlassCard className="border border-red-400/25 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 text-red-300" size={18} />
              <div>
                <div className="text-sm font-semibold text-red-200">Admin backend unavailable</div>
                <p className="mt-1 text-xs text-red-100/80">{error}</p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, accent }) => (
            <GlassCard key={label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{label}</span>
                <Icon size={16} className={accent} />
              </div>
              <div className="mt-4 text-2xl font-display font-bold text-white">{value}</div>
            </GlassCard>
          ))}
        </div>

        <GlassPanel className="p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Analytics / المحافظات</p><h2 className="mt-1 text-xl font-bold text-white">توزيع المستخدمين حسب المحافظة</h2></div><span className="text-[10px] uppercase tracking-[0.12em] text-white/40">{stats.totalUsers ?? userCount} مستخدم</span></div>
          <div className="mt-4 space-y-3">{governorateAnalytics.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">لسه مفيش بيانات محافظات.</div> : governorateAnalytics.map((entry) => <div key={entry.governorate}><div className="mb-1 flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-white">{entry.governorate}</span><span className="text-cyan-200">{entry.count} مستخدم • {entry.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all" style={{ width: `${Math.min(100, entry.percentage)}%` }} /></div></div>)}</div>
        </GlassPanel>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2"><Users size={16} className="text-pink-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Gender Ratio</p><h2 className="mt-1 text-xl font-bold text-white">نسبة الولاد والبنات</h2></div></div>
            <div className="mt-5 space-y-4">
              <GenderRatioRow label="الولاد" count={genderAnalytics.male.count} percentage={genderAnalytics.male.percentage} color="bg-cyan-400" />
              <GenderRatioRow label="البنات" count={genderAnalytics.female.count} percentage={genderAnalytics.female.percentage} color="bg-pink-400" />
            </div>
            <div className="mt-5 flex items-center justify-center"><div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: `conic-gradient(#22d3ee 0 ${genderAnalytics.male.percentage}%, #f472b6 ${genderAnalytics.male.percentage}% 100%)` }}><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-zinc-950"><span className="text-2xl font-display font-bold text-white">{(genderAnalytics.male.percentage + genderAnalytics.female.percentage).toFixed(0)}%</span><span className="text-[9px] uppercase text-white/40">classified</span></div></div></div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BarChart3 size={16} className="text-cyan-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">User Growth</p><h2 className="mt-1 text-xl font-bold text-white">نمو المستخدمين آخر 14 يوم</h2></div></div><span className="text-[10px] uppercase text-white/40">تسجيلات يومية</span></div>
            {userGrowthAnalytics.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">لسه مفيش بيانات نمو.</div> : <div className="mt-5"><div className="flex h-44 items-end gap-1.5 border-b border-white/10 px-1">{userGrowthAnalytics.map((entry) => <div key={entry.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-32 w-full items-end justify-center"><div className="w-full max-w-7 rounded-t-lg bg-gradient-to-t from-cyan-500 to-pink-400 transition-all group-hover:brightness-125" style={{ height: `${Math.max(4, (entry.newUsers / maxGrowth) * 100)}%` }} title={`${entry.label}: ${entry.newUsers} مستخدم`} /></div><span className="max-w-full truncate text-[9px] text-white/40">{entry.label}</span></div>)}</div><div className="mt-3 flex items-center justify-between text-[10px] text-white/45"><span>أعلى يوم: {Math.max(...userGrowthAnalytics.map((entry) => entry.newUsers), 0)} تسجيل</span><span>الإجمالي التراكمي: {userGrowthAnalytics[userGrowthAnalytics.length - 1]?.cumulativeUsers ?? 0}</span></div></div>}
          </GlassPanel>
        </div>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-cyan-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Global Broadcast</p>
              <h2 className="mt-1 text-xl font-bold text-white">إعلان لكل المستخدمين</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <textarea value={broadcastText} onChange={(event) => setBroadcastText(event.target.value)} rows={2} placeholder="اكتب رسالة قصيرة للمستخدمين النشطين..." className="min-h-20 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-cyan-400/50" />
            <button type="button" onClick={() => void sendBroadcast()} className="rounded-2xl bg-cyan-400 px-5 py-3 text-xs font-bold text-zinc-950 sm:self-end">إرسال الإعلان</button>
          </div>
          {broadcastStatus && <p className="mt-3 text-xs text-cyan-200">{broadcastStatus}</p>}
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2"><MessageSquare size={16} className="text-pink-300" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Direct Message</p><h2 className="mt-1 text-xl font-bold text-white">رسالة لمستخدم محدد</h2></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[0.7fr_1.3fr_auto]"><input value={directUserId} onChange={(event) => setDirectUserId(event.target.value)} placeholder="#PF-10042" className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30" /><textarea value={directMessage} onChange={(event) => setDirectMessage(event.target.value)} rows={2} placeholder="اكتب رسالتك للمستخدم..." className="resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30" /><button type="button" onClick={() => void sendDirectMessage()} className="rounded-2xl bg-pink-400 px-4 py-3 text-xs font-bold text-zinc-950">إرسال</button></div>
          {directStatus && <p className="mt-3 text-xs text-pink-200">{directStatus}</p>}
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Subscriptions</p><h2 className="mt-1 text-xl font-bold text-white">طلبات الاشتراك</h2></div><span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-200">{subscriptionRequests.filter((item) => item.status === 'pending').length} pending</span></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="space-y-3">{subscriptionRequests.filter((item) => item.status === 'pending').length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">مفيش طلبات معلقة دلوقتي.</div> : subscriptionRequests.filter((item) => item.status === 'pending').map((request) => <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"><div className="flex gap-3"><img src={request.receiptDataUrl} alt="صورة التحويل" className="h-20 w-20 rounded-xl object-cover" /><div className="min-w-0 flex-1"><div className="text-sm font-semibold text-white">{request.username}</div><div className="truncate text-xs text-white/50">{request.email}</div><div className="mt-1 text-xs font-bold text-neon-cyan">{request.plan === 'monthly' ? 'الشهرية' : request.plan === 'yearly' ? 'السنوية' : 'الأبدية'}</div></div></div><div className="mt-3 flex gap-2"><button type="button" onClick={() => void reviewSubscription(request, 'approve')} className="flex-1 rounded-xl bg-neon-green px-3 py-2 text-xs font-bold text-ink-900">قبول</button><button type="button" onClick={() => void reviewSubscription(request, 'decline')} className="flex-1 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">رفض</button></div></div>)}</div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"><div className="text-sm font-semibold text-white">تفعيل يدوي</div><p className="mt-1 text-xs leading-5 text-white/45">فعّل Pro لأي مستخدم من غير إيصال.</p><input value={grantEmail} onChange={(event) => setGrantEmail(event.target.value)} placeholder="email@example.com" className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" /><select value={grantPlan} onChange={(event) => setGrantPlan(event.target.value as typeof grantPlan)} className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"><option value="monthly">الشهرية</option><option value="yearly">السنوية</option><option value="lifetime">الأبدية</option></select><button type="button" onClick={() => void grantPro()} className="mt-3 w-full rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-zinc-950">تفعيل Pro</button></div>
          </div>
          {subscriptionStatus && <p className="mt-3 text-xs text-cyan-200">{subscriptionStatus}</p>}
        </GlassPanel>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <GlassPanel className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Registered users</p>
                <h2 className="mt-1 text-xl font-bold text-white">User Directory</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/40">
                <Clock3 size={12} />
                {lastUpdated}
              </div>
            </div>

            <div className="space-y-3">
              {loading && users.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
                  No registered users were returned by the configured backend.
                </div>
              ) : (
                users.map((userItem, index) => {
                  const itemId = userItem.id ?? userItem.email ?? `${userItem.firstName ?? 'user'}-${index}`;
                  const isEditing = editingId === itemId;
                  const isBusy = actionBusyId === itemId;
                  const status = userItem.status ?? (userItem.isSuspended ? 'suspended' : userItem.isBanned ? 'banned' : userItem.isActive === false ? 'suspended' : 'active');

                  return (
                    <div key={itemId} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {userItem.firstName ?? 'Unknown'} {userItem.lastName ?? ''}
                          </div>
                          <div className="text-xs text-white/50">{userItem.email ?? 'No email'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(userItem)}
                            disabled={isBusy}
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${status === 'active' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}
                          >
                            {status === 'active' ? 'Active' : 'Suspended'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(itemId)}
                            disabled={isBusy}
                            className="rounded-full border border-red-400/30 bg-red-500/10 p-2 text-red-200"
                            aria-label={`Delete ${userItem.email ?? 'user'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              value={editDraft.username ?? userItem.username ?? userItem.firstName ?? ''}
                              onChange={(event) => setEditDraft((current) => ({ ...current, username: event.target.value }))}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30"
                              placeholder="Username"
                            />
                            <input
                              value={editDraft.email ?? userItem.email ?? ''}
                              onChange={(event) => setEditDraft((current) => ({ ...current, email: event.target.value }))}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30"
                              placeholder="Email"
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              type="number"
                              value={editDraft.streakDays ?? userItem.streakDays ?? 0}
                              onChange={(event) => setEditDraft((current) => ({ ...current, streakDays: Number(event.target.value) || 0 }))}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                              placeholder="Streak Days"
                            />
                            <select
                              value={editDraft.status ?? status}
                              onChange={(event) => setEditDraft((current) => ({ ...current, status: event.target.value as AdminUserUpdatePayload['status'] }))}
                              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white"
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="banned">Banned</option>
                            </select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setEditDraft({});
                              }}
                              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSaveUser(itemId)}
                              disabled={isBusy}
                              className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-2 text-[11px] text-white/60 sm:grid-cols-3">
                          <div>
                            <span className="block text-white/40 uppercase tracking-[0.14em]">Last login</span>
                            {userItem.lastLogin ?? userItem.lastSeen ?? '—'}
                          </div>
                          <div>
                            <span className="block text-white/40 uppercase tracking-[0.14em]">Created</span>
                            {userItem.createdAt ?? '—'}
                          </div>
                          <div>
                            <span className="block text-white/40 uppercase tracking-[0.14em]">Activity</span>
                            {userItem.activityCount ?? 0} events
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(itemId);
                              setEditDraft({
                                username: userItem.username ?? userItem.firstName ?? '',
                                email: userItem.email ?? '',
                                streakDays: userItem.streakDays ?? 0,
                                status,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200"
                          >
                            <PencilLine size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(userItem)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200"
                          >
                            {status === 'active' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                            {status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">System metrics</p>
            <h2 className="mt-1 text-xl font-bold text-white">Runtime Overview</h2>

            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Uptime</div>
                <div className="mt-2 text-base font-semibold text-white">{stats.uptime ?? 'Unavailable'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Last sync</div>
                <div className="mt-2 text-base font-semibold text-white">{stats.lastSync ?? 'Awaiting backend'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Admin email</div>
                <div className="mt-2 text-base font-semibold text-white">{getAdminEmail()}</div>
              </div>
            </div>
          </GlassPanel>
        </div>

        <GlassPanel className="p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Activity log</p>
            <h2 className="mt-1 text-xl font-bold text-white">Latest Events</h2>
          </div>

          <div className="space-y-3">
            {activityLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
                No activity entries have been received from the configured backend yet.
              </div>
            ) : (
              activityLogs.slice(0, 8).map((entry, index) => (
                <div key={entry.id ?? `${entry.type}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{entry.type ?? 'Activity'}</div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">{entry.timestamp ?? 'Unknown time'}</div>
                  </div>
                  <div className="mt-2 text-sm text-white/70">{entry.message ?? 'No message provided.'}</div>
                  {entry.userEmail && <div className="mt-2 text-xs text-cyan-200">{entry.userEmail}</div>}
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>

      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-red-500/25 bg-zinc-950/90 p-5 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">Confirm deletion</p>
            <h3 className="mt-2 text-2xl font-bold text-white">Delete this athlete?</h3>
            <p className="mt-2 text-sm text-white/70">
              This action permanently removes the user from the connected database. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteUser(pendingDeleteId)}
                className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-200"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenderRatioRow({ label, count, percentage, color }: { label: string; count: number; percentage: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-white">{label}</span>
        <span className="text-white/60">{count} مستخدم • {percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, percentage)}%` }} />
      </div>
    </div>
  );
}
