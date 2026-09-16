export type Screen = 'auth' | 'dashboard' | 'diet' | 'plans' | 'friends' | 'profile' | 'onboarding' | 'workout' | 'generator' | 'admin';

export type AuthMode = 'login' | 'signup';

export type Gender = 'male' | 'female';
export type AppMode = Gender;

export type MacroGoal = 'cutting' | 'bulking' | 'maintenance';
export type SubscriptionPlan = 'monthly' | 'yearly' | 'lifetime';

export interface User {
  id?: string;
  publicUserId?: string;
  governorate?: string | null;
  createdAt?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  profilePicture?: string | null;
  gender?: Gender;
  weight?: number;
  height?: number;
  age?: number;
  streakDays?: number;
  completedWorkouts?: number;
  goalsCompleted?: number;
  points?: number;
  badges?: string[];
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'pending';
  subscriptionExpiresAt?: string | null;
  goal?: MacroGoal;
}

export interface OnboardingProfile {
  gender: Gender;
  age: number;
  weight: number;
  height: number;
  goal: MacroGoal;
  activityLevel?: ActivityLevel;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

export type WorkoutType = 'gym' | 'bodyweight';
export type WorkoutMode = 'Gym' | 'Home';
export type WorkoutCategory = 'Chest' | 'Back' | 'Legs' | 'Arms' | 'Shoulders' | 'Abs';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  type: WorkoutMode;
  icon: string;
  imageUrl: string;
  tips?: string[];
  instructions?: string[];
}

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  duration: number;
  calories: number;
  exercises: string[];
  intensity: 'Low' | 'Medium' | 'High';
  icon: string;
  category?: WorkoutCategory;
}

export interface MealEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  icon: string;
  source?: 'database' | 'custom';
}

export interface QuickAddMealInput {
  name?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface InBodyRecord {
  id: string;
  date: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  photoDataUrl?: string;
  notes?: string;
}

export interface InBodyRecordInput {
  date?: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  photoDataUrl?: string;
  notes?: string;
}

export interface DailyStats {
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  carbsConsumed: number;
  carbsGoal: number;
  fatConsumed: number;
  fatGoal: number;
  waterConsumed: number;
  waterGoal: number;
  steps: number;
  stepsGoal: number;
  heartRateResting: number;
  heartRatePeak: number;
  activeCalories: number;
  sleepHours: number;
  sleepMinutes: number;
}

export interface MetricHistoryEntry {
  dayKey: string;
  steps: number;
  activeCalories: number;
  waterConsumed: number;
  streakDays: number;
}

export interface WaterLogEntry {
  id: string;
  amountMl: number;
  createdAt: string;
  dayKey: string;
}
