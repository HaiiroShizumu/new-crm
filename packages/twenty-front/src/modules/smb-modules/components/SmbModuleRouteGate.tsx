import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

import { useIsInstalledApplicationsLoaded } from '@/smb-modules/hooks/useIsInstalledApplicationsLoaded';
import { useIsSmbModuleEnabled } from '@/smb-modules/hooks/useIsSmbModuleEnabled';
import { useSmbModuleApplicationLifecycle } from '@/smb-modules/hooks/useSmbModuleApplicationLifecycle';
import { getSmbModuleRouteGateOutcome } from '@/smb-modules/utils/getSmbModuleRouteGateOutcome';
import { SmbPageContentSkeletonLoader } from '@/smb-skin/components/SmbPageContentSkeletonLoader';

type SmbModuleRouteGateProps = {
  moduleKey: string;
  children: ReactNode;
};

export const SmbModuleRouteGate = ({
  moduleKey,
  children,
}: SmbModuleRouteGateProps) => {
  const isEnabled = useIsSmbModuleEnabled(moduleKey);
  const isInstalledApplicationsLoaded = useIsInstalledApplicationsLoaded();
  const applicationLifecycle = useSmbModuleApplicationLifecycle(moduleKey);

  const outcome = getSmbModuleRouteGateOutcome({
    isInstalledApplicationsLoaded,
    isApplicationLifecycleLoading: applicationLifecycle === 'loading',
    isEnabled,
  });

  // RV-3: пока список App не загружен (или идут статусы установки/удаления),
  // показываем заглушку вместо страницы — выключенный модуль не должен
  // мелькать своей страницей до редиректа.
  if (outcome === 'loading') {
    return <SmbPageContentSkeletonLoader />;
  }

  // App не установлен (или установка/удаление не завершены) → адрес ведёт себя
  // как несуществующий, а не как «страница открыта, данных нет».
  if (outcome === 'redirect') {
    return <Navigate to={AppPath.Index} replace />;
  }

  return <>{children}</>;
};
