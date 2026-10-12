import { SMB_MODULE_MANIFESTS } from '@/smb-modules/registry';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';
import { filterEnabledSmbModules } from '@/smb-modules/utils/filterEnabledSmbModules';

const buildManifest = (
  key: string,
  applicationUniversalIdentifier: string,
): SmbModuleManifest => ({
  key,
  applicationUniversalIdentifier,
  dependsOn: [],
  routes: [{ path: `/${key}`, loader: async () => ({ default: () => null }) }],
  navigation: [],
  recordTabs: [],
  embed: null,
});

describe('filterEnabledSmbModules', () => {
  it('enables a module only when its application is installed', () => {
    const manifests = [buildManifest('absences', 'app-absences')];
    const installed = new Set(['app-absences']);

    expect(filterEnabledSmbModules(manifests, installed)).toEqual(manifests);
    expect(filterEnabledSmbModules(manifests, new Set())).toEqual([]);
    expect(filterEnabledSmbModules(manifests, new Set(['app-other']))).toEqual(
      [],
    );
  });

  it('ignores dependsOn when the module application itself is installed', () => {
    const manifest: SmbModuleManifest = {
      ...buildManifest('feed', 'app-feed'),
      dependsOn: ['org-structure'],
    };

    expect(
      filterEnabledSmbModules([manifest], new Set(['app-feed'])),
    ).toEqual([manifest]);
  });

  it('keeps registration order and drops nothing for a full install', () => {
    const manifests = [buildManifest('a', 'app-a'), buildManifest('b', 'app-b')];

    expect(
      filterEnabledSmbModules(manifests, new Set(['app-b', 'app-a'])),
    ).toEqual(manifests);
  });
});

describe('SMB_MODULE_MANIFESTS', () => {
  it('has unique keys, unique applications and absolute route paths', () => {
    const keys = SMB_MODULE_MANIFESTS.map((manifest) => manifest.key);
    const applications = SMB_MODULE_MANIFESTS.map(
      (manifest) => manifest.applicationUniversalIdentifier,
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(applications).size).toBe(applications.length);
    expect(
      SMB_MODULE_MANIFESTS.every((manifest) =>
        manifest.routes.every((route) => route.path.startsWith('/')),
      ),
    ).toBe(true);
  });
});
