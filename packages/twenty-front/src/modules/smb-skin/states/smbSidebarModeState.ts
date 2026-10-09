import { type SmbSidebarMode } from '@/smb-skin/types/SmbSidebarMode';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbSidebarModeState = createAtomState<SmbSidebarMode>({
  key: 'smb.sidebarMode',
  defaultValue: 'edge',
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: (sidebarMode) =>
    sidebarMode === 'floating' || sidebarMode === 'edge',
});
