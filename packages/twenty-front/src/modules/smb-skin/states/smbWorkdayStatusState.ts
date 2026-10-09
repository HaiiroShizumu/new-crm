import { type SmbWorkdayStatus } from '@/smb-skin/types/SmbWorkdayStatus';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const smbWorkdayStatusState = createAtomState<SmbWorkdayStatus>({
  key: 'smb.workdayStatus',
  defaultValue: 'finished',
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: (workdayStatus) =>
    workdayStatus === 'started' ||
    workdayStatus === 'paused' ||
    workdayStatus === 'finished',
});
