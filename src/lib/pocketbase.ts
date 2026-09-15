import PocketBase, { type RecordModel } from 'pocketbase';

export interface LeaderboardRecord extends RecordModel {
  id: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  city?: string;
  avatar?: string | null;
  profilePicture?: string | null;
  points?: number;
  score?: number;
  totalPoints?: number;
  totalScore?: number;
  steps?: number;
  streak?: number;
  streakDays?: number;
  streakWeeks?: number;
  calories?: number;
  activeCalories?: number;
  completedWorkouts?: number;
  workoutsCompleted?: number;
  totalWorkouts?: number;
  isCurrentUser?: boolean;
}

const getPocketBaseUrl = () => import.meta.env.VITE_POCKETBASE_URL?.trim() || '';

const toNumber = (value: unknown) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeRecord = (record: RecordModel): LeaderboardRecord => {
  const firstName = String(record.firstName || '').trim();
  const lastName = String(record.lastName || '').trim();
  const username = String(record.username || '').trim();
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ') || username || String(record.email || '').split('@')[0] || 'User';

  return {
    ...record,
    id: String(record.id || record.email || fallbackName),
    email: String(record.email || '').trim(),
    name: String(record.name || fallbackName).trim(),
    username,
    firstName,
    lastName,
    city: String(record.city || '').trim() || '—',
    avatar: record.avatar ?? record.profilePicture ?? null,
    profilePicture: record.profilePicture ?? record.avatar ?? null,
    points: Math.max(0, toNumber(record.points ?? record.totalPoints ?? record.score ?? record.totalScore)),
    score: Math.max(0, toNumber(record.score ?? record.totalScore ?? record.points ?? record.totalPoints)),
    streakDays: Math.max(0, toNumber(record.streakDays ?? record.streak ?? 0)),
    streakWeeks: Math.max(0, toNumber(record.streakWeeks ?? Math.floor((record.streakDays ?? record.streak ?? 0) / 7))),
    completedWorkouts: Math.max(0, toNumber(record.completedWorkouts ?? record.workoutsCompleted ?? record.totalWorkouts ?? 0)),
    steps: Math.max(0, toNumber(record.steps ?? 0)),
    calories: Math.max(0, toNumber(record.calories ?? record.activeCalories ?? 0)),
    activeCalories: Math.max(0, toNumber(record.activeCalories ?? record.calories ?? 0)),
  };
};

export async function fetchLeaderboardRecords(limit = 50): Promise<LeaderboardRecord[]> {
  const url = getPocketBaseUrl();
  if (!url) {
    return [];
  }

  const client = new PocketBase(url);

  const strategies = [
    { collection: 'users', sort: '-points' },
    { collection: 'users', sort: '-totalPoints' },
    { collection: 'users', sort: '-score' },
    { collection: 'users', sort: '-completedWorkouts' },
    { collection: 'users', sort: '-workoutsCompleted' },
    { collection: 'profiles', sort: '-points' },
    { collection: 'profiles', sort: '-totalPoints' },
    { collection: 'profiles', sort: '-score' },
    { collection: 'profiles', sort: '-completedWorkouts' },
  ];

  for (const strategy of strategies) {
    try {
      const response = await client.collection(strategy.collection).getList(1, limit, { sort: strategy.sort });
      const items = (response.items || []).map(normalizeRecord);

      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      console.warn(`PocketBase query failed for ${strategy.collection} sorted by ${strategy.sort}.`, error);
    }
  }

  return [];
}
