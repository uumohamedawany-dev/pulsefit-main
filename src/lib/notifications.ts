import { LocalNotifications } from '@capacitor/local-notifications';
import type { Language } from '@/lib/i18n';

const hydrationMessages: Record<Language, string[]> = {
  en: [
    'Time for a sip of water! 💧',
    'How many glasses have you had? Keep your body hydrated.',
    'A small glass of water can boost your energy and focus. 💧',
  ],
  ar: [
    'حان وقت شرب الماء! 💧',
    'كم كوبًا شربت حتى الآن؟ حافظ على ترطيب جسمك.',
    'كوب ماء صغير يساعد على طاقتك وتركيزك اليوم. 💧',
  ],
};

export async function scheduleHydrationReminders(language: Language = 'en'): Promise<boolean> {
  try {
    const permission = await LocalNotifications.requestPermissions();

    if (permission.display !== 'granted') {
      return false;
    }

    const reminderIntervalMs = 90 * 60 * 1000;
    const reminderCount = 7 * 24 * 60 / 90;
    await LocalNotifications.cancel({ notifications: Array.from({ length: reminderCount }, (_, index) => ({ id: 9200 + index })) });

    const now = new Date();
    const notifications = Array.from({ length: reminderCount }, (_, index) => {
      const at = new Date(now.getTime() + (index + 1) * reminderIntervalMs);
      return {
        id: 9200 + index,
        title: 'Hydration reminder 💧',
        body: hydrationMessages[language][index % hydrationMessages[language].length],
        schedule: { at },
        sound: undefined,
      };
    });

    await LocalNotifications.schedule({ notifications });
    return true;
  } catch {
    return false;
  }
}
