import { lazy } from 'react';

import { LazyRoute } from '@/app/components/LazyRoute';
import { type WorkspaceRouteObject } from '@/app/routing/types/WorkspaceRouteObject';
import { SmbModuleRouteGate } from '@/smb-modules/components/SmbModuleRouteGate';
import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

const MAIN_SURFACE = ['main'] as const;

// Маршруты регистрируются для всех модулей реестра, но отдаются пользователю
// только когда установлен App модуля (SmbModuleRouteGate): вычислить состав
// установленных при сборке роутера нельзя — Apollo-провайдер живёт ВНУТРИ
// дерева маршрутов (WorkspaceAppProviders), а пересборка роутера на каждую
// установку перезапускала бы всю воркспейс-часть.
export const createSmbModuleRouteObjects = (
  manifests: readonly SmbModuleManifest[] = SMB_MODULE_MANIFESTS,
): WorkspaceRouteObject[] =>
  manifests.flatMap((manifest) =>
    manifest.routes.map((route) => {
      const ModulePage = lazy(route.loader);

      return {
        path: route.path,
        element: (
          <SmbModuleRouteGate moduleKey={manifest.key}>
            <LazyRoute>
              <ModulePage />
            </LazyRoute>
          </SmbModuleRouteGate>
        ),
        handle: { workspaceSurfaces: MAIN_SURFACE },
      } satisfies WorkspaceRouteObject;
    }),
  );
