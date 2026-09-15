export type DrinkCategory = 'bulking' | 'cutting';

export interface DrinkItem {
  id: string;
  name: string;
  category: DrinkCategory;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  preparation: string[];
  benefits: string;
}

export const drinkDatabase: DrinkItem[] = [
  {
    id: 'banana-peanut-oat-mass-shake',
    name: 'عصير الموز وزبدة الفول السوداني والشوفان',
    category: 'bulking',
    calories: 720,
    protein: 34,
    carbs: 86,
    fats: 28,
    ingredients: ['موزة كبيرة', '60 جم شوفان', 'ملعقتين زبدة فول سوداني', '250 مل لبن', 'رشة قرفة'],
    preparation: ['حط كل المكونات في الخلاط.', 'اضربهم لحد ما القوام يبقى ناعم.', 'قدمه ساقع بعد التمرين أو بين الوجبات.'],
    benefits: 'سعرات عالية وبروتين وكربوهيدرات يساعدوا على زيادة الوزن والكتلة العضلية.',
  },
  {
    id: 'muscle-builder-smoothie',
    name: 'سموذي التكاثر العضلي',
    category: 'bulking',
    calories: 610,
    protein: 42,
    carbs: 72,
    fats: 16,
    ingredients: ['سكوب واي بروتين', 'موزة', '50 جم شوفان', '200 مل لبن', 'ملعقة عسل'],
    preparation: ['اخلط اللبن والموز والشوفان.', 'ضيف البروتين والعسل واضرب الخليط مرة كمان.', 'اشربه خلال ساعتين من التمرين.'],
    benefits: 'بروتين سريع وكربوهيدرات مناسبة لدعم الاستشفاء بعد تمرين المقاومة.',
  },
  {
    id: 'green-tea-ginger-lemon',
    name: 'الشاي الأخضر بالزنجبيل والليمون',
    category: 'cutting',
    calories: 12,
    protein: 0,
    carbs: 3,
    fats: 0,
    ingredients: ['كيس شاي أخضر', 'شريحتين زنجبيل طازة', 'نصف ليمونة', 'كوباية مياه سخنة'],
    preparation: ['انقع الشاي والزنجبيل 3 إلى 5 دقايق.', 'ضيف الليمون بعد ما يهدى شوية.', 'اشربه من غير سكر أو استخدم مُحلي بدون سعرات.'],
    benefits: 'مشروب خفيف يساعد على الترطيب وتقليل السعرات، والزنجبيل يدي دفء وانتعاش.',
  },
  {
    id: 'cinnamon-mint-water',
    name: 'مشروب القرفة والنعناع لتقليل السوائل',
    category: 'cutting',
    calories: 8,
    protein: 0,
    carbs: 2,
    fats: 0,
    ingredients: ['عود قرفة', 'حفنة نعناع', 'شريحتين ليمون', '500 مل مياه'],
    preparation: ['سخن المياه مع القرفة 5 دقايق.', 'اطفي النار وضيف النعناع والليمون.', 'سيبه يبرد واشربه على مدار اليوم.'],
    benefits: 'منعش وقليل السعرات. لا يعتبر علاجًا لاحتباس السوائل، واستشر طبيبك لو المشكلة مستمرة.',
  },
];
