import { Logger } from '@nestjs/common';
import { type Repository } from 'typeorm';

import { type ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { SmbModulesVersionCheckService } from 'src/modules/smb-modules/services/smb-modules-version-check.service';
import { SMB_SERVER_MODULE_MANIFESTS } from 'src/modules/smb-modules/registry';
import {
  readSmbModulesVersionStatus,
  setSmbModulesVersionStatus,
  readSmbModulesHealth,
} from 'src/modules/smb-modules/utils/smb-modules-version-status';

const MODULE_KEY = 'absences';
const APPLICATION_UNIVERSAL_IDENTIFIER = '3f2b8a10-5d4c-4e2b-9a7f-1c2d3e4f5a6b';
const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';

const buildApplicationRow = (
  version: string | null,
): Pick<
  ApplicationEntity,
  | 'id'
  | 'universalIdentifier'
  | 'workspaceId'
  | 'version'
  | 'state'
  | 'deletedAt'
> => ({
  id: 'e096b3b8-f8b9-40cb-92ce-787a5da58520',
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  workspaceId: WORKSPACE_ID,
  version,
  state: ApplicationState.INSTALLED,
  deletedAt: null,
});

describe('SmbModulesVersionCheckService (M-7)', () => {
  let find: jest.Mock;
  let service: SmbModulesVersionCheckService;
  let warnSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeAll(() => {
    SMB_SERVER_MODULE_MANIFESTS.push({
      key: MODULE_KEY,
      applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
      expectedVersion: '1.4.0',
    });
  });

  afterAll(() => {
    SMB_SERVER_MODULE_MANIFESTS.splice(0);
  });

  beforeEach(() => {
    setSmbModulesVersionStatus(null);
    find = jest.fn();
    service = new SmbModulesVersionCheckService({
      find,
    } as unknown as Repository<ApplicationEntity>);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('предупреждает в журнале, когда установленная версия ≠ версии в коде', async () => {
    find.mockResolvedValue([buildApplicationRow('1.3.0')]);

    await service.onModuleInit();

    expect(readSmbModulesVersionStatus()).toEqual({
      checkedAt: expect.any(String),
      mismatches: [
        {
          key: MODULE_KEY,
          applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
          expectedVersion: '1.4.0',
          installedVersions: [
            { workspaceId: WORKSPACE_ID, version: '1.3.0', state: 'INSTALLED' },
          ],
        },
      ],
    });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain(MODULE_KEY);
  });

  it('считает незавершённую установку (version = null) расхождением', async () => {
    find.mockResolvedValue([buildApplicationRow(null)]);

    await service.onModuleInit();

    expect(
      readSmbModulesVersionStatus()?.mismatches[0]?.installedVersions[0]
        ?.version,
    ).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('не предупреждает, когда версия совпала', async () => {
    find.mockResolvedValue([buildApplicationRow('1.4.0')]);

    await service.onModuleInit();

    expect(readSmbModulesVersionStatus()?.mismatches).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });

  it('не предупреждает, когда App нигде не установлен', async () => {
    find.mockResolvedValue([]);

    await service.onModuleInit();

    expect(readSmbModulesVersionStatus()?.mismatches).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('логирует ошибку и не падает, если БД недоступна', async () => {
    find.mockRejectedValue(new Error('connection refused'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(readSmbModulesVersionStatus()).toBeNull();
  });
});

describe('readSmbModulesHealth (GET /healthz/smb, M-7)', () => {
  afterEach(() => {
    setSmbModulesVersionStatus(null);
  });

  it('not_checked, пока сверка не выполнялась', () => {
    expect(readSmbModulesHealth()).toEqual({
      status: 'not_checked',
      checkedAt: null,
      mismatches: [],
    });
  });

  it('ok, когда расхождений нет', () => {
    setSmbModulesVersionStatus({ checkedAt: 'now', mismatches: [] });

    expect(readSmbModulesHealth()).toEqual({
      status: 'ok',
      checkedAt: 'now',
      mismatches: [],
    });
  });

  it('warning с перечнем расхождений при несовпадении версий', () => {
    const mismatches = [
      {
        key: 'absences',
        applicationUniversalIdentifier: 'uuid',
        expectedVersion: '1.4.0',
        installedVersions: [],
      },
    ];

    setSmbModulesVersionStatus({ checkedAt: 'now', mismatches });

    expect(readSmbModulesHealth()).toEqual({
      status: 'warning',
      checkedAt: 'now',
      mismatches,
    });
  });
});
