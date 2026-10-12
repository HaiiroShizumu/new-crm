import { type RecentMenuNavigationTransition } from '@/smb-shell/navigation/types/RecentMenuNavigationTransition';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const recentMenuNavigationTransitionsState = createAtomState<
  RecentMenuNavigationTransition[]
>({
  key: 'recentMenuNavigationTransitionsState',
  defaultValue: [],
  useLocalStorage: true,
});
