import { SMB_DEFAULT_BACKGROUND } from '@/smb-skin/constants/SmbDefaultBackground';
import { type SmbBackground } from '@/smb-skin/types/SmbBackground';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { isNumber } from '@sniptt/guards';

export const smbBackgroundState = createAtomState<SmbBackground>({
  key: 'smb.background',
  defaultValue: SMB_DEFAULT_BACKGROUND,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: (background) =>
    (background.type === 'none' || background.type === 'image') &&
    isNumber(background.dim) &&
    isNumber(background.blur),
});
