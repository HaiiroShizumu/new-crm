import { getSmbApplicationLifecycle } from '@/smb-modules/utils/getSmbApplicationLifecycle';
import { filterEnabledSmbModules } from '@/smb-modules/utils/filterEnabledSmbModules';
import { getSmbModuleRouteGateOutcome } from '@/smb-modules/utils/getSmbModuleRouteGateOutcome';
import { type SmbModuleManifest } from '@/smb-modules/types/SmbModuleManifest';
import { JobState } from '~/generated-metadata/graphql';

const buildManifest = (key: string): SmbModuleManifest => ({
  key,
  applicationUniversalIdentifier: `app-${key}`,
  dependsOn: [],
  routes: [{ path: `/${key}`, loader: async () => ({ default: () => null }) }],
  navigation: [],
  recordTabs: [],
  embed: null,
});

describe('getSmbApplicationLifecycle (RV-2)', () => {
  const baseArgs = {
    canSeeJobStatus: true,
    isLoadingJobStatus: false,
    installJobStatus: null,
    uninstallJobStatus: null,
  };

  it('is idle when no job is running', () => {
    expect(getSmbApplicationLifecycle(baseArgs)).toBe('idle');
  });

  it('is installing while the install job has not finished', () => {
    expect(
      getSmbApplicationLifecycle({
        ...baseArgs,
        installJobStatus: { state: JobState.ACTIVE },
      }),
    ).toBe('installing');
    expect(
      getSmbApplicationLifecycle({
        ...baseArgs,
        installJobStatus: { state: JobState.WAITING },
      }),
    ).toBe('installing');
  });

  it('is install-failed when the install job failed', () => {
    expect(
      getSmbApplicationLifecycle({
        ...baseArgs,
        installJobStatus: { state: JobState.FAILED },
      }),
    ).toBe('install-failed');
  });

  it('is uninstalling while the uninstall job runs, even after a failed install', () => {
    expect(
      getSmbApplicationLifecycle({
        ...baseArgs,
        installJobStatus: { state: JobState.FAILED },
        uninstallJobStatus: { state: JobState.ACTIVE },
      }),
    ).toBe('uninstalling');
  });

  it('is unknown without the APPLICATIONS permission flag', () => {
    expect(
      getSmbApplicationLifecycle({
        ...baseArgs,
        canSeeJobStatus: false,
        installJobStatus: { state: JobState.ACTIVE },
      }),
    ).toBe('unknown');
  });

  it('is loading while the job status queries are in flight', () => {
    expect(
      getSmbApplicationLifecycle({ ...baseArgs, isLoadingJobStatus: true }),
    ).toBe('loading');
  });
});

describe('filterEnabledSmbModules (RV-2)', () => {
  const manifest = buildManifest('absences');
  const installed = new Set(['app-absences']);

  it('keeps an installed app without lifecycle information', () => {
    expect(filterEnabledSmbModules([manifest], installed)).toEqual([manifest]);
    expect(filterEnabledSmbModules([manifest], installed, {})).toEqual([
      manifest,
    ]);
  });

  it.each(['installing', 'install-failed', 'uninstalling'] as const)(
    'disables the module while the app lifecycle is %s',
    (lifecycle) => {
      expect(
        filterEnabledSmbModules([manifest], installed, {
          'app-absences': lifecycle,
        }),
      ).toEqual([]);
    },
  );

  it('keeps the module while statuses are unknown or still loading', () => {
    expect(
      filterEnabledSmbModules([manifest], installed, {
        'app-absences': 'unknown',
      }),
    ).toEqual([manifest]);
    expect(
      filterEnabledSmbModules([manifest], installed, {
        'app-absences': 'loading',
      }),
    ).toEqual([manifest]);
  });

  it('still ignores lifecycle for an app that is not installed', () => {
    expect(
      filterEnabledSmbModules([manifest], new Set(), {
        'app-absences': 'idle',
      }),
    ).toEqual([]);
  });
});

describe('getSmbModuleRouteGateOutcome (RV-3)', () => {
  const baseArgs = {
    isInstalledApplicationsLoaded: true,
    isApplicationLifecycleLoading: false,
    isEnabled: true,
  };

  it('shows the page when the module is enabled and everything is loaded', () => {
    expect(getSmbModuleRouteGateOutcome(baseArgs)).toBe('open');
  });

  it('shows the loading placeholder until the app list is loaded', () => {
    expect(
      getSmbModuleRouteGateOutcome({
        ...baseArgs,
        isEnabled: false,
        isInstalledApplicationsLoaded: false,
      }),
    ).toBe('loading');
  });

  it('shows the loading placeholder while lifecycle statuses load, even for an enabled module', () => {
    expect(
      getSmbModuleRouteGateOutcome({
        ...baseArgs,
        isApplicationLifecycleLoading: true,
      }),
    ).toBe('loading');
  });

  it('redirects a disabled module instead of rendering its page', () => {
    expect(getSmbModuleRouteGateOutcome({ ...baseArgs, isEnabled: false })).toBe(
      'redirect',
    );
  });
});
