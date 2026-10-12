import { lazy } from 'react';

import { LazyRoute } from '@/app/components/LazyRoute';
import { type WorkspaceRouteObject } from '@/app/routing/types/WorkspaceRouteObject';
import { SmbModuleRouteGate } from '@/smb-modules/components/SmbModuleRouteGate';
import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

const MAIN_SURFACE = ['main'] as const;

// RV-1: lazy() создаёт новый тип компонента при каждом вызове. createWorkspace-
// RouteObjects (а значит и createSmbModuleRouteObjects) вызывается больше одного
// раза за жизнь приложения, и без кэша каждая пересборка роутера поднимала бы
// новый тип — React размонтировал бы открытую страницу модуля. Ключ кэша —
// key модуля + путь маршрута: он уникален в реестре, а loader у одного ключа
// всегда один и тот же, поэтому ссылка на компонент стабильна между вызовами.
const modulePageByCacheKey = new Map<string, ReturnType<typeof lazy>>();

const getModulePageComponent = (
  cacheKey: string,
  loader: SmbModuleManifest['routes'][number]['loader'],
): ReturnType<typeof lazy> => {
  const cachedModulePage = modulePageByCacheKey.get(cacheKey);

  if (cachedModulePage !== undefined) {
    return cachedModulePage;
  }

  const modulePage = lazy(loader);
  modulePageByCacheKey.set(cacheKey, modulePage);

  return modulePage;
};

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
      const ModulePage = getModulePageComponent(
        `${manifest.key}:${route.path}`,
        route.loader,
      );

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
