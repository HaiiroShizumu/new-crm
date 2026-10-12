import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { smbApplicationLifecycleState } from '@/smb-modules/states/smbApplicationLifecycleState';
import { type SmbApplicationLifecycle } from '@/smb-modules/types/SmbApplicationLifecycle';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

// Состояние жизненного цикла App модуля: undefined — ещё не записано
// (решает список установленных App), 'loading' — статусы ещё запрашиваются.
export const useSmbModuleApplicationLifecycle = (
  moduleKey: string,
): SmbApplicationLifecycle | undefined => {
  const smbApplicationLifecycle = useAtomStateValue(
    smbApplicationLifecycleState,
  );
  const manifest = SMB_MODULE_MANIFESTS.find(
    (candidate) => candidate.key === moduleKey,
  );

  if (manifest === undefined) {
    return undefined;
  }

  return smbApplicationLifecycle[manifest.applicationUniversalIdentifier];
};
