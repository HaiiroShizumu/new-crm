import { SMB_DEFAULT_ACCENT } from '@/smb-skin/constants/SmbDefaultAccent';
import { isSmbHexColor } from '@/smb-skin/utils/isSmbHexColor';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbAccentState = createAtomState<string>({
  key: 'smb.accent',
  defaultValue: SMB_DEFAULT_ACCENT,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: isSmbHexColor,
});
