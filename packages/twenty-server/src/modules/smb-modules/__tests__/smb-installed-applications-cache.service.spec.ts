import { type ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { SMB_MODULES_CACHE_TTL_MS } from 'src/modules/smb-modules/constants/smb-modules-cache-ttl.constant';
import { SmbInstalledApplicationsCacheService } from 'src/modules/smb-modules/services/smb-installed-applications-cache.service';

const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';

const APPLICATION_ROWS: ApplicationEntity[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    universalIdentifier: 'aaaaaaaa-0000-4000-8000-000000000001',
    version: '1.4.0',
    state: ApplicationState.INSTALLED,
    deletedAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    universalIdentifier: 'aaaaaaaa-0000-4000-8000-000000000002',
    version: null,
    state: ApplicationState.INSTALLED,
    deletedAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    universalIdentifier: 'aaaaaaaa-0000-4000-8000-000000000003',
    version: '1.4.0',
    state: ApplicationState.INSTALLING,
    deletedAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    universalIdentifier: 'aaaaaaaa-0000-4000-8000-000000000004',
    version: '1.4.0',
    state: ApplicationState.UNINSTALLING,
    deletedAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    universalIdentifier: 'aaaaaaaa-0000-4000-8000-000000000005',
    version: '1.4.0',
    state: ApplicationState.UPGRADING,
    deletedAt: null,
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    universalIdentifier: 'aaaaaaaa-0000-4000-8000-000000000006',
    version: '1.4.0',
    state: ApplicationState.INSTALLED,
    deletedAt: new Date('2026-10-12T00:00:00Z'),
  },
] as ApplicationEntity[];

const isEnabled = (
  service: SmbInstalledApplicationsCacheService,
  universalIdentifier: string,
) =>
  service.isModuleEnabled({
    workspaceId: WORKSPACE_ID,
    universalIdentifier,
  });

describe('SmbInstalledApplicationsCacheService (M-4, RV-2)', () => {
  let find: jest.Mock;
  let service: SmbInstalledApplicationsCacheService;

  beforeEach(() => {
    find = jest.fn().mockResolvedValue(APPLICATION_ROWS);
    service = new SmbInstalledApplicationsCacheService({
      find,
    } as unknown as WorkspaceScopedRepository<ApplicationEntity>);
  });

  it('считает включённым только полностью установленный App (RV-2)', async () => {
    // установлена → включён
    await expect(
      isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001'),
    ).resolves.toBe(true);
    // установка не завершена (version не записан) → выключен
    await expect(
      isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000002'),
    ).resolves.toBe(false);
    // INSTALLING → выключен
    await expect(
      isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000003'),
    ).resolves.toBe(false);
    // UNINSTALLING → выключен
    await expect(
      isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000004'),
    ).resolves.toBe(false);
    // UPGRADING → выключен
    await expect(
      isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000005'),
    ).resolves.toBe(false);
    // soft-deleted → выключен
    await expect(
      isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000006'),
    ).resolves.toBe(false);
    // отсутствует → выключен
    await expect(
      isEnabled(service, 'bbbbbbbb-0000-4000-8000-000000000000'),
    ).resolves.toBe(false);

    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith(WORKSPACE_ID, {
      select: ['id', 'universalIdentifier', 'version', 'state', 'deletedAt'],
    });
  });

  it('держит результат в памяти до TTL и перечитывает после', async () => {
    await isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001');
    await isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001');
    expect(find).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(SMB_MODULES_CACHE_TTL_MS + 1);

    await isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001');
    expect(find).toHaveBeenCalledTimes(2);
  });

  it('не размножает одновременные первые запросы компании', async () => {
    await Promise.all(
      Array.from({ length: 5 }, () =>
        isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001'),
      ),
    );

    expect(find).toHaveBeenCalledTimes(1);
  });

  it('invalidate() сбрасывает кэш компании', async () => {
    await isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001');
    expect(find).toHaveBeenCalledTimes(1);

    service.invalidate(WORKSPACE_ID);

    await isEnabled(service, 'aaaaaaaa-0000-4000-8000-000000000001');
    expect(find).toHaveBeenCalledTimes(2);
  });
});
