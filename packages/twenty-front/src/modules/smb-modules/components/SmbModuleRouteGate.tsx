import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';

import { useIsInstalledApplicationsLoaded } from '@/smb-modules/hooks/useIsInstalledApplicationsLoaded';
import { useIsSmbModuleEnabled } from '@/smb-modules/hooks/useIsSmbModuleEnabled';

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

  // App не установлен → адрес ведёт себя как несуществующий, а не как
  // «страница открыта, данных нет». До первой загрузки списка App пропускаем,
  // иначе прямая ссылка уводила бы на главную раньше, чем мы что-то знаем.
  if (isInstalledApplicationsLoaded && !isEnabled) {
    return <Navigate to={AppPath.Index} replace />;
  }

  return <>{children}</>;
};
