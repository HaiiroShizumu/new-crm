import { type ReactElement } from 'react';

import { createSmbModuleRouteObjects } from '@/smb-modules/createSmbModuleRouteObjects';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';

const buildManifest = (
  key: string,
  routePaths: readonly string[] = [`/${key}`],
): SmbModuleManifest => ({
  key,
  applicationUniversalIdentifier: `app-${key}`,
  dependsOn: [],
  routes: routePaths.map((path) => ({
    path,
    loader: async () => ({ default: () => null }),
  })),
  navigation: [],
  recordTabs: [],
  embed: null,
});

type ElementWithProps = ReactElement<{ children: ReactElement }>;

// Структура element: SmbModuleRouteGate > LazyRoute > страница модуля.
const getRenderedModulePage = (route: {
  element?: unknown;
}): unknown => {
  const gateElement = route.element as ElementWithProps;
  const lazyRouteElement = gateElement.props.children as ElementWithProps;

  return lazyRouteElement.props.children.type;
};

describe('createSmbModuleRouteObjects (RV-1)', () => {
  it('keeps the module page component reference stable between calls', () => {
    const manifests = [buildManifest('absences')];

    const firstCall = createSmbModuleRouteObjects(manifests);
    const secondCall = createSmbModuleRouteObjects(manifests);

    expect(firstCall).toHaveLength(1);
    expect(secondCall).toHaveLength(1);
    expect(getRenderedModulePage(secondCall[0])).toBe(
      getRenderedModulePage(firstCall[0]),
    );
  });

  it('reuses one component per key+path for repeated routes of one call', () => {
    const manifests = [
      buildManifest('absences', ['/absences', '/absences/archive']),
    ];

    const routes = createSmbModuleRouteObjects(manifests);

    expect(routes).toHaveLength(2);
    expect(getRenderedModulePage(routes[0])).not.toBe(
      getRenderedModulePage(routes[1]),
    );

    const nextCall = createSmbModuleRouteObjects(manifests);
    expect(getRenderedModulePage(nextCall[0])).toBe(
      getRenderedModulePage(routes[0]),
    );
    expect(getRenderedModulePage(nextCall[1])).toBe(
      getRenderedModulePage(routes[1]),
    );
  });

  it('does not share a component between different module keys on the same path', () => {
    const manifests = [buildManifest('a', ['/shared']), buildManifest('b', ['/shared'])];

    const routes = createSmbModuleRouteObjects(manifests);

    expect(getRenderedModulePage(routes[0])).not.toBe(
      getRenderedModulePage(routes[1]),
    );
  });
});
