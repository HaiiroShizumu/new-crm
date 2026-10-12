import { useInstalledApplications } from '@/applications/hooks/useInstalledApplications';
import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { smbApplicationLifecycleState } from '@/smb-modules/states/smbApplicationLifecycleState';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';
import { filterEnabledSmbModules } from '@/smb-modules/utils/filterEnabledSmbModules';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useEnabledSmbModules = (): SmbModuleManifest[] => {
  const installedApplications = useInstalledApplications();
  const smbApplicationLifecycle = useAtomStateValue(
    smbApplicationLifecycleState,
  );

  return filterEnabledSmbModules(
    SMB_MODULE_MANIFESTS,
    new Set(
      installedApplications.map(
        ({ universalIdentifier }) => universalIdentifier,
      ),
    ),
    smbApplicationLifecycle,
  );
};
