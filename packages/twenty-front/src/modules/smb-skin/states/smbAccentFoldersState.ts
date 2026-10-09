import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbAccentFoldersState = createAtomState<boolean>({
  key: 'smb.accentFolders',
  defaultValue: true,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
