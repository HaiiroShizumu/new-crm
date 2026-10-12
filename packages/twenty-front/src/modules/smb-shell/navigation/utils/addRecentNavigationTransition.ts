import { type RecentMenuNavigationTransition } from '@/smb-shell/navigation/types/RecentMenuNavigationTransition';

export const MAX_RECENT_MENU_NAVIGATION_TRANSITIONS = 10;

export const addRecentNavigationTransition = (
  existing: RecentMenuNavigationTransition[],
  next: Pick<RecentMenuNavigationTransition, 'path' | 'label'> & {
    visitedAt?: number;
  },
): RecentMenuNavigationTransition[] => {
  const visitedAt = next.visitedAt ?? Date.now();
  const withoutDuplicate = existing.filter((item) => item.path !== next.path);

  return [
    { path: next.path, label: next.label, visitedAt },
    ...withoutDuplicate,
  ].slice(0, MAX_RECENT_MENU_NAVIGATION_TRANSITIONS);
};
