import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const isSecondaryNavigationSidebarOpenState = createAtomState<boolean>({
  key: 'navigation.isSecondaryNavigationSidebarOpen',
  defaultValue: true,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
