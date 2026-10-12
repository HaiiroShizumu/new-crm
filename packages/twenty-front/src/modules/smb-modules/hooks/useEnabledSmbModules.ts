import { useInstalledApplications } from '@/applications/hooks/useInstalledApplications';
import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';
import { filterEnabledSmbModules } from '@/smb-modules/utils/filterEnabledSmbModules';

export const useEnabledSmbModules = (): SmbModuleManifest[] => {
  const installedApplications = useInstalledApplications();

  return filterEnabledSmbModules(
    SMB_MODULE_MANIFESTS,
    new Set(
      installedApplications.map(
        ({ universalIdentifier }) => universalIdentifier,
      ),
    ),
  );
};
