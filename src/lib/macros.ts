import type { ActivityLevel, Gender, MacroGoal, OnboardingProfile } from '@/types';

export interface OfflineMacrosInputs extends OnboardingProfile {}

export interface MacroBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OfflineMacrosCalculation {
  bmr: number;
  tdee: number;
  targetDailyCalories: number;
  macroBreakdown: MacroBreakdown;
}

export const goalFactors: Record<MacroGoal, { factor: number; label: string; caloriesDelta: number }> = {
  cutting: { factor: 0.85, label: 'Cutting', caloriesDelta: -15 },
  bulking: { factor: 1.10, label: 'Bulking', caloriesDelta: 10 },
  maintenance: { factor: 1.0, label: 'Maintenance', caloriesDelta: 0 },
};

export const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

export function calculateOfflineMacros(inputs: OfflineMacrosInputs): OfflineMacrosCalculation {
  const weight = Math.max(1, inputs.weight);
  const height = Math.max(1, inputs.height);
  const age = Math.max(1, inputs.age);
  const activityMultiplier = activityFactors[inputs.activityLevel ?? 'sedentary'];

  const maleBmr = 10 * weight + 6.25 * height - 5 * age + 5;
  const femaleBmr = 10 * weight + 6.25 * height - 5 * age - 161;

  const bmr = inputs.gender === 'male' ? maleBmr : femaleBmr;
  const tdee = bmr * activityMultiplier;
  const goal = goalFactors[inputs.goal];

  const targetDailyCalories = Math.round(tdee * goal.factor);

  const proteinCalories = Math.round(targetDailyCalories * 0.4);
  const carbsCalories = Math.round(targetDailyCalories * 0.35);
  const fatCalories = Math.round(targetDailyCalories * 0.25);

  const macroBreakdown = {
    calories: targetDailyCalories,
    protein: Math.round(proteinCalories / 4),
    carbs: Math.round(carbsCalories / 4),
    fat: Math.round(fatCalories / 9),
  };

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetDailyCalories,
    macroBreakdown,
  };
}

export function normalizeGender(gender: Gender): Gender {
  return gender === 'female' ? 'female' : 'male';
}
