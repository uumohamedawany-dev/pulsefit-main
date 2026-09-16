import { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { GlassPanel } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';
import { fetchNotifications, markNotificationRead, type AppNotification } from '@/lib/api';

export function NotificationCenter() {
  const { user, refreshUserProfile, t, language } = useApp();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  const refresh = async () => {
    if (!user?.email) return;
    try {
      setItems(await fetchNotifications(user.email));
      await refreshUserProfile();
    } catch {
      // Notification history is best-effort and should never block the dashboard.
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refreshUserProfile, user?.email]);

  const unread = items.filter((item) => !item.read).length;

  const readItem = async (item: AppNotification) => {
    if (!user?.email || item.read) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry));
    await markNotificationRead(user.email, item.id);
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-white/70 transition hover:text-neon-cyan" aria-label={t('Open notifications')}>
        <Bell size={18} />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-neon-pink px-1 text-[9px] font-black text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      {open && <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(88vw,360px)] max-w-[calc(100vw-2rem)]"><GlassPanel className="max-h-[70vh] overflow-y-auto border-neon-cyan/25 p-4 shadow-2xl shadow-cyan-950/30"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-[10px] uppercase tracking-[0.18em] text-neon-cyan">PulseFit</div><h3 className="mt-1 text-lg font-bold text-white">{t('Notifications')}</h3></div><button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-full p-2 text-white/50 hover:text-white" aria-label={t('Close notifications')}><X size={16} /></button></div>{items.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs text-white/45">{t('No new notifications right now.')}</div> : <div className="mt-4 space-y-2">{items.map((item) => <button key={item.id} type="button" onClick={() => void readItem(item)} className={`w-full rounded-2xl border p-3 text-left transition ${item.read ? 'border-white/10 bg-white/[0.02]' : 'border-neon-cyan/25 bg-neon-cyan/5'}`}><div className="flex items-start gap-2"><div className={`mt-0.5 rounded-full p-1 ${item.read ? 'bg-white/5 text-white/40' : 'bg-neon-cyan/10 text-neon-cyan'}`}><Check size={12} /></div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-white">{item.title}</div><div className="mt-1 text-xs leading-5 text-white/65">{item.message}</div><div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-white/35">{new Date(item.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</div></div></div></button>)}</div>}</GlassPanel></div>}
    </div>
  );
}
