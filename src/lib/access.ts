import { isAdminUser } from '@/lib/api';
import type { User } from '@/types';

export function isProUser(user: User | null): boolean {
  return Boolean(user && (isAdminUser(user) || user.subscriptionStatus === 'active' || user.subscriptionPlan === 'lifetime'));
}
