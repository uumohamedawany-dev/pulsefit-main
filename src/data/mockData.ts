import type { Workout, MealEntry, DailyStats } from '@/types';

export interface EgyptianFood {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  type: 'Meal' | 'Snack';
  recommended_goal: 'Cutting' | 'Bulking';
}

export const egyptianFoods: EgyptianFood[] = [
  { name: 'فول مدمس (100 جرام)', calories: 110, protein_g: 8.0, carbs_g: 20.0, fats_g: 1.0, type: 'Meal', recommended_goal: 'Cutting' },
  { name: 'كشري مصري (100 جرام)', calories: 160, protein_g: 6.0, carbs_g: 30.0, fats_g: 2.0, type: 'Meal', recommended_goal: 'Bulking' },
  { name: 'جبنة قريش (100 جرام)', calories: 98, protein_g: 11.0, carbs_g: 3.0, fats_g: 4.0, type: 'Meal', recommended_goal: 'Cutting' },
  { name: 'مكرونة بشاميل (100 جرام)', calories: 180, protein_g: 7.0, carbs_g: 18.0, fats_g: 9.0, type: 'Meal', recommended_goal: 'Bulking' },
  { name: 'ترمس مسلوق (100 جرام)', calories: 120, protein_g: 11.0, carbs_g: 13.0, fats_g: 3.0, type: 'Snack', recommended_goal: 'Cutting' },
  { name: 'بسكويت فريسكا (قطعة)', calories: 130, protein_g: 1.5, carbs_g: 18.0, fats_g: 6.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'زبادي يوناني (100 جرام)', calories: 80, protein_g: 8.0, carbs_g: 4.0, fats_g: 3.0, type: 'Snack', recommended_goal: 'Cutting' },
  { name: 'كفتة مشوية (100 جرام)', calories: 220, protein_g: 15.0, carbs_g: 4.0, fats_g: 16.0, type: 'Meal', recommended_goal: 'Cutting' },
  { name: 'شيبسي بالملح (كيس وسط - 50 جرام)', calories: 260, protein_g: 3.0, carbs_g: 26.0, fats_g: 16.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'تايجر شيبس (كيس وسط - 50 جرام)', calories: 255, protein_g: 3.5, carbs_g: 25.0, fats_g: 15.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'دوريتوس (كيس وسط - 50 جرام)', calories: 250, protein_g: 3.5, carbs_g: 30.0, fats_g: 12.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'شيتوس كرانشي (كيس وسط - 50 جرام)', calories: 270, protein_g: 2.5, carbs_g: 28.0, fats_g: 16.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'فشار بالملح (صنع منزلي - 3 أكواب)', calories: 93, protein_g: 3.0, carbs_g: 18.0, fats_g: 1.1, type: 'Snack', recommended_goal: 'Cutting' },
  { name: 'مولتو بالشوكولاتة (حجم عادي)', calories: 210, protein_g: 4.0, carbs_g: 24.0, fats_g: 11.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'باتيه بالجبنة (حجم عادي)', calories: 230, protein_g: 6.0, carbs_g: 22.0, fats_g: 13.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'توينكيز (قطعة واحدة)', calories: 135, protein_g: 1.0, carbs_g: 22.0, fats_g: 4.5, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'هوهوز (قطعة واحدة)', calories: 120, protein_g: 1.0, carbs_g: 17.0, fats_g: 5.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'تودو براونيز (قطعة واحدة)', calories: 180, protein_g: 2.0, carbs_g: 25.0, fats_g: 8.0, type: 'Snack', recommended_goal: 'Bulking' },
  { name: 'شوفان بالحليب والموز (طبق متوسط)', calories: 320, protein_g: 12.0, carbs_g: 55.0, fats_g: 6.0, type: 'Meal', recommended_goal: 'Bulking' },
  { name: 'بيض مسلوق (بيضة واحدة كبيرة)', calories: 78, protein_g: 6.3, carbs_g: 0.6, fats_g: 5.3, type: 'Snack', recommended_goal: 'Cutting' },
  { name: 'تونة مصفاة من الزيت (علبة 140 جرام)', calories: 130, protein_g: 29.0, carbs_g: 0.0, fats_g: 1.0, type: 'Meal', recommended_goal: 'Cutting' },
  { name: 'صدور دجاج مشوية (100 جرام)', calories: 165, protein_g: 31.0, carbs_g: 0.0, fats_g: 3.6, type: 'Meal', recommended_goal: 'Cutting' },
  { name: 'بطاطس محمرة / مقلية (100 جرام)', calories: 312, protein_g: 3.4, carbs_g: 41.0, fats_g: 15.0, type: 'Snack', recommended_goal: 'Bulking' },
];

export const dailyStats: DailyStats = {
  caloriesConsumed: 1840,
  caloriesGoal: 2400,
  proteinConsumed: 142,
  proteinGoal: 180,
  carbsConsumed: 210,
  carbsGoal: 280,
  fatConsumed: 58,
  fatGoal: 75,
  waterConsumed: 0,
  waterGoal: 12,
  steps: 0,
  stepsGoal: 10000,
  heartRateResting: 66,
  heartRatePeak: 144,
  activeCalories: 0,
  sleepHours: 7,
  sleepMinutes: 20,
};

export const gymWorkouts: Workout[] = [
  {
    id: 'w1',
    name: 'Push Day',
    type: 'gym',
    duration: 55,
    calories: 420,
    intensity: 'High',
    exercises: ['Bench Press', 'Overhead Press', 'Dips', 'Cable Flyes'],
    icon: 'dumbbell',
  },
  {
    id: 'w2',
    name: 'Pull Day',
    type: 'gym',
    duration: 50,
    calories: 380,
    intensity: 'High',
    exercises: ['Deadlift', 'Pull-ups', 'Barbell Row', 'Face Pulls'],
    icon: 'dumbbell',
  },
  {
    id: 'w3',
    name: 'Leg Day',
    type: 'gym',
    duration: 60,
    calories: 520,
    intensity: 'High',
    exercises: ['Squats', 'Romanian DL', 'Leg Press', 'Calf Raises'],
    icon: 'dumbbell',
  },
];

export const bodyweightWorkouts: Workout[] = [
  {
    id: 'bw1',
    name: 'Upper Body Blast',
    type: 'bodyweight',
    duration: 30,
    calories: 280,
    intensity: 'Medium',
    exercises: ['Push-ups', 'Pike Push-ups', 'Dips', 'Plank to Push-up'],
    icon: 'flame',
  },
  {
    id: 'bw2',
    name: 'Core Crusher',
    type: 'bodyweight',
    duration: 20,
    calories: 180,
    intensity: 'Medium',
    exercises: ['Hollow Hold', 'Leg Raises', 'Russian Twists', 'Bicycle Crunches'],
    icon: 'flame',
  },
  {
    id: 'bw3',
    name: 'HIIT Inferno',
    type: 'bodyweight',
    duration: 25,
    calories: 340,
    intensity: 'High',
    exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'High Knees'],
    icon: 'flame',
  },
];

export const meals: MealEntry[] = [
  {
    id: 'm1',
    name: 'Greek Yogurt & Berries',
    calories: 320,
    protein: 22,
    carbs: 38,
    fat: 8,
    time: '08:00',
    icon: 'sunrise',
  },
  {
    id: 'm2',
    name: 'Grilled Chicken Bowl',
    calories: 540,
    protein: 48,
    carbs: 52,
    fat: 14,
    time: '12:30',
    icon: 'salad',
  },
  {
    id: 'm3',
    name: 'Protein Shake',
    calories: 240,
    protein: 36,
    carbs: 18,
    fat: 4,
    time: '16:00',
    icon: 'cup-soda',
  },
  {
    id: 'm4',
    name: 'Salmon & Sweet Potato',
    calories: 620,
    protein: 42,
    carbs: 48,
    fat: 26,
    time: '19:30',
    icon: 'fish',
  },
];

export const weeklyCaloriesData = [
  { day: 'M', value: 2100 },
  { day: 'T', value: 2350 },
  { day: 'W', value: 1980 },
  { day: 'T', value: 2450 },
  { day: 'F', value: 2200 },
  { day: 'S', value: 1800 },
  { day: 'S', value: 1840 },
];
