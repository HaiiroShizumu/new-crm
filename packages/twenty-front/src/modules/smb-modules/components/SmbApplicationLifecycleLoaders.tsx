import { useQuery } from '@apollo/client/react';
import { useEffect } from 'react';

import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { smbApplicationLifecycleState } from '@/smb-modules/states/smbApplicationLifecycleState';
import { getSmbApplicationLifecycle } from '@/smb-modules/utils/getSmbApplicationLifecycle';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import {
  FindInstallApplicationJobStatusDocument,
  FindUninstallApplicationJobStatusDocument,
  PermissionFlagType,
} from '~/generated-metadata/graphql';

type SmbApplicationLifecycleLoaderEffectProps = {
  universalIdentifier: string;
};

// Один запрос на приложение: статусы джоб установки и удаления доступны только
// с флагом APPLICATIONS (SettingsPermissionGuard), поэтому без прав компонент
// пишет 'unknown' и модуль живёт по списку установленных App, как раньше.
const SmbApplicationLifecycleLoaderEffect = ({
  universalIdentifier,
}: SmbApplicationLifecycleLoaderEffectProps) => {
  const canSeeJobStatus = useHasPermissionFlag(PermissionFlagType.APPLICATIONS);

  const { data: installData, loading: isInstallLoading } = useQuery(
    FindInstallApplicationJobStatusDocument,
    {
      variables: { universalIdentifier },
      skip: !canSeeJobStatus,
    },
  );
  const { data: uninstallData, loading: isUninstallLoading } = useQuery(
    FindUninstallApplicationJobStatusDocument,
    {
      variables: { universalIdentifier },
      skip: !canSeeJobStatus,
    },
  );

  const setSmbApplicationLifecycle = useSetAtomState(
    smbApplicationLifecycleState,
  );

  const lifecycle = getSmbApplicationLifecycle({
    canSeeJobStatus,
    isLoadingJobStatus: isInstallLoading || isUninstallLoading,
    installJobStatus: installData?.findInstallApplicationJobStatus,
    uninstallJobStatus: uninstallData?.findUninstallApplicationJobStatus,
  });

  useEffect(() => {
    setSmbApplicationLifecycle((previousLifecycles) =>
      previousLifecycles[universalIdentifier] === lifecycle
        ? previousLifecycles
        : { ...previousLifecycles, [universalIdentifier]: lifecycle },
    );
  }, [lifecycle, setSmbApplicationLifecycle, universalIdentifier]);

  return null;
};

// SmbApplicationLifecycleLoaders монтируется в оболочке (SmbShellLayout):
// Apollo-провайдер живёт выше дерева маршрутов, набор приложений задан
// реестром и не меняется во время работы — число загрузчиков статично.
export const SmbApplicationLifecycleLoaders = () => (
  <>
    {SMB_MODULE_MANIFESTS.filter(
      (manifest) => manifest.isPlatform !== true,
    ).map((manifest) => (
      <SmbApplicationLifecycleLoaderEffect
        key={manifest.key}
        universalIdentifier={manifest.applicationUniversalIdentifier}
      />
    ))}
  </>
);
