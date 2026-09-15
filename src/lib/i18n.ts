export type Language = 'en' | 'ar';

const translations: Record<Language, Record<string, string>> = {
  en: {},
  ar: {
    Home: 'الرئيسية',
    Diet: 'التغذية',
    Plans: 'الخطط',
    Friends: 'الأصدقاء',
    Workouts: 'التمارين',
    Smart: 'ذكي',
    Profile: 'الملف الشخصي',
    'Language / اللغة': 'اللغة',
    English: 'الإنجليزية',
    Arabic: 'العربية',
    'Enable Biometric Login': 'تفعيل تسجيل الدخول بالبصمة',
    'Not now': 'ليس الآن',
    Enable: 'تفعيل',
    'App Locked': 'التطبيق مقفل',
    'Authenticate to continue using PulseFit.': 'وثّق هويتك لمتابعة استخدام PulseFit.',
    'Unlock with Biometrics': 'فتح بالبصمة',
    'Cycle Tracker': 'متابعة الدورة',
    'Last Period Start': 'بداية آخر دورة',
    'Cycle Length': 'مدة الدورة',
    'Fitness Tip': 'نصيحة لياقة',
    'Activate Streak Saver': 'تفعيل حماية الاستمرارية',
    'Pause duration': 'مدة التوقف',
    'Streak Saver Active': 'حماية الاستمرارية مفعلة',
    'Deactivate Streak Saver': 'إلغاء حماية الاستمرارية',
    'Hydration reminder 💧': 'تذكير بالترطيب 💧',
    'Hydration time 💧': 'وقت الترطيب 💧',
    'Great job! This glass of water will support your energy. 💧': 'أحسنت! كوب الماء هذا سيدعم طاقتك. 💧',
    'Have a glass of water to keep your energy up. 💧': 'اشرب كوبًا من الماء للحفاظ على طاقتك. 💧',
    'Sign In': 'تسجيل الدخول',
    'Sign Up': 'إنشاء حساب',
    'Settings': 'الإعدادات',
    'Push Notifications': 'إشعارات الدفع',
    'Privacy Mode': 'وضع الخصوصية',
    'Female Mode': 'الوضع النسائي',
    Security: 'الأمان',
  },
};

export function translate(language: Language, key: string, fallback = key) {
  return translations[language][key] || (language === 'en' ? fallback : fallback);
}