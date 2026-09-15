import type { AppMode, WorkoutCategory } from '@/types';

export type SplitSystem =
  | 'BigRamy'
  | 'Arnold'
  | 'PPL'
  | 'Bro'
  | 'UpperLower'
  | 'GluteCoreFocus'
  | 'SculptTone'
  | 'HourglassShape';

export type WorkoutGoal =
  | 'Cutting'
  | 'Bulking'
  | 'Body Sculpting'
  | 'Lower Body & Curves'
  | 'Toning & Core'
  | 'Pilates & Flexibility'
  | 'Classic Strength';

export interface ScheduleDay {
  day: number;
  label: string;
  categories: WorkoutCategory[];
}

export const MALE_SPLITS: SplitSystem[] = ['BigRamy', 'Arnold', 'PPL', 'Bro', 'UpperLower'];
export const FEMALE_SPLITS: SplitSystem[] = ['GluteCoreFocus', 'SculptTone', 'HourglassShape', 'PPL', 'Bro', 'UpperLower'];

export const MALE_GOALS: WorkoutGoal[] = ['Cutting', 'Bulking'];
export const FEMALE_GOALS: WorkoutGoal[] = ['Body Sculpting', 'Lower Body & Curves', 'Toning & Core', 'Pilates & Flexibility', 'Classic Strength'];

export function getSplitOptions(appMode: AppMode): SplitSystem[] {
  return appMode === 'female' ? FEMALE_SPLITS : MALE_SPLITS;
}

export function getGoalOptions(appMode: AppMode): WorkoutGoal[] {
  return appMode === 'female' ? FEMALE_GOALS : MALE_GOALS;
}

export function generateWorkoutSplit(system: SplitSystem): ScheduleDay[] {
  if (system === 'BigRamy') {
    return [
      { day: 1, label: 'Heavy Chest & Triceps', categories: ['Chest', 'Arms'] },
      { day: 2, label: 'Massive Back & Biceps', categories: ['Back', 'Arms'] },
      { day: 3, label: 'Heavy Quads & Calves', categories: ['Legs'] },
      { day: 4, label: 'Shoulders & Traps', categories: ['Shoulders'] },
      { day: 5, label: 'Hamstrings & Abs', categories: ['Legs', 'Abs'] },
      { day: 6, label: 'Rest / Pump', categories: [] },
    ];
  }

  if (system === 'Arnold') {
    return [
      { day: 1, label: 'Chest / Back', categories: ['Chest', 'Back'] },
      { day: 2, label: 'Legs', categories: ['Legs'] },
      { day: 3, label: 'Shoulders / Arms', categories: ['Shoulders', 'Arms'] },
      { day: 4, label: 'Chest / Back', categories: ['Chest', 'Back'] },
      { day: 5, label: 'Legs', categories: ['Legs'] },
      { day: 6, label: 'Shoulders / Arms', categories: ['Shoulders', 'Arms'] },
    ];
  }

  if (system === 'PPL') {
    return [
      { day: 1, label: 'Push', categories: ['Chest', 'Shoulders', 'Arms'] },
      { day: 2, label: 'Pull', categories: ['Back', 'Arms', 'Abs'] },
      { day: 3, label: 'Legs', categories: ['Legs'] },
      { day: 4, label: 'Push', categories: ['Chest', 'Shoulders', 'Arms'] },
      { day: 5, label: 'Pull', categories: ['Back', 'Arms', 'Abs'] },
      { day: 6, label: 'Legs', categories: ['Legs'] },
    ];
  }

  if (system === 'Bro') {
    return [
      { day: 1, label: 'Chest', categories: ['Chest'] },
      { day: 2, label: 'Back', categories: ['Back'] },
      { day: 3, label: 'Shoulders', categories: ['Shoulders'] },
      { day: 4, label: 'Legs', categories: ['Legs'] },
      { day: 5, label: 'Arms & Abs', categories: ['Arms', 'Abs'] },
    ];
  }

  if (system === 'UpperLower') {
    return [
      { day: 1, label: 'Upper', categories: ['Chest', 'Back', 'Shoulders', 'Arms'] },
      { day: 2, label: 'Lower', categories: ['Legs', 'Abs'] },
      { day: 3, label: 'Upper', categories: ['Chest', 'Back', 'Shoulders', 'Arms'] },
      { day: 4, label: 'Lower', categories: ['Legs', 'Abs'] },
    ];
  }

  if (system === 'GluteCoreFocus') {
    return [
      { day: 1, label: 'Lower Body & Curves', categories: ['Legs'] },
      { day: 2, label: 'Core Sculpt', categories: ['Abs'] },
      { day: 3, label: 'Full Body Sculpt', categories: ['Chest', 'Back', 'Legs', 'Abs'] },
    ];
  }

  if (system === 'SculptTone') {
    return [
      { day: 1, label: 'Lower Body & Curves', categories: ['Legs'] },
      { day: 2, label: 'Upper Sculpt', categories: ['Chest', 'Back', 'Shoulders', 'Arms'] },
      { day: 3, label: 'Core & Posture', categories: ['Abs'] },
      { day: 4, label: 'Full Body Sculpt', categories: ['Chest', 'Back', 'Legs', 'Abs'] },
    ];
  }

  if (system === 'HourglassShape') {
    return [
      { day: 1, label: 'Lower Body & Curves', categories: ['Legs'] },
      { day: 2, label: 'Upper Sculpt', categories: ['Chest', 'Shoulders', 'Arms'] },
      { day: 3, label: 'Core & Posture', categories: ['Abs'] },
      { day: 4, label: 'Pilates Flow', categories: ['Abs', 'Legs'] },
      { day: 5, label: 'Full Body Sculpt', categories: ['Chest', 'Back', 'Legs', 'Abs'] },
    ];
  }

  return [];
}

export function suggestSplitByGoalAndDays(daysPerWeek: number, goal: WorkoutGoal, appMode: AppMode = 'male'): SplitSystem {
  if (appMode === 'female') {
    if (goal === 'Classic Strength') {
      if (daysPerWeek >= 6) return 'PPL';
      if (daysPerWeek >= 4) return 'UpperLower';
      return 'Bro';
    }

    if (goal === 'Body Sculpting') {
      if (daysPerWeek >= 5) return 'HourglassShape';
      if (daysPerWeek >= 4) return 'SculptTone';
      return 'GluteCoreFocus';
    }

    if (goal === 'Lower Body & Curves') {
      if (daysPerWeek >= 5) return 'HourglassShape';
      if (daysPerWeek >= 4) return 'SculptTone';
      return 'GluteCoreFocus';
    }

    if (goal === 'Toning & Core') {
      if (daysPerWeek >= 5) return 'HourglassShape';
      if (daysPerWeek >= 4) return 'SculptTone';
      return 'GluteCoreFocus';
    }

    if (daysPerWeek >= 4) return 'SculptTone';
    return 'GluteCoreFocus';
  }

  if (goal === 'Bulking') {
    if (daysPerWeek >= 6) return 'BigRamy';
    if (daysPerWeek >= 4) return 'Bro';
    return 'UpperLower';
  }

  if (daysPerWeek >= 6) return 'Arnold';
  if (daysPerWeek >= 4) return 'PPL';
  return 'UpperLower';
}
