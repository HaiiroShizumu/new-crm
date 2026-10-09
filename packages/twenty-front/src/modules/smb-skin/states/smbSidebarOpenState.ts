import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbSidebarOpenState = createAtomState<boolean>({
  key: 'smb.sidebarOpen',
  defaultValue: true,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
