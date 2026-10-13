import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import { SMB_MODULE_KEY_METADATA } from 'src/modules/smb-modules/constants/smb-module-key-metadata.constant';
import { RequireSmbModule } from 'src/modules/smb-modules/decorators/require-smb-module.decorator';
import { SmbModuleGuard } from 'src/modules/smb-modules/guards/smb-module.guard';
import { SMB_SERVER_MODULE_MANIFESTS } from 'src/modules/smb-modules/registry';
import { SmbInstalledApplicationsCacheService } from 'src/modules/smb-modules/services/smb-installed-applications-cache.service';

const MODULE_KEY = 'tasks';
const APPLICATION_UNIVERSAL_IDENTIFIER = '9b1f0f7a-1c2f-4a1e-9c3e-1f2a3b4c5d6e';

const buildExecutionContext = ({
  handler,
  controller,
  workspaceId,
}: {
  handler: () => void;
  controller: new () => unknown;
  workspaceId?: string;
}): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => controller,
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => (workspaceId === undefined ? {} : { workspaceId }),
    }),
  }) as unknown as ExecutionContext;

describe('RequireSmbModule', () => {
  class TasksController {
    @RequireSmbModule(MODULE_KEY)
    findManyTasks() {}
  }

  const handler = TasksController.prototype.findManyTasks;

  it('кладёт ключ модуля в метаданные handler', () => {
    expect(Reflect.getMetadata(SMB_MODULE_KEY_METADATA, handler)).toBe(
      MODULE_KEY,
    );
  });

  it('вешает SmbModuleGuard на handler', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      SmbModuleGuard,
    ]);
  });
});

describe('SmbModuleGuard', () => {
  class TestController {
    @RequireSmbModule(MODULE_KEY)
    handler() {}
  }

  const handler = TestController.prototype.handler;

  const isModuleEnabled = jest.fn();

  const cacheService = {
    isModuleEnabled,
  } as unknown as SmbInstalledApplicationsCacheService;

  const guardWithCache = () =>
    new SmbModuleGuard(new Reflector(), cacheService);

  const context = (workspaceId?: string): ExecutionContext =>
    buildExecutionContext({ handler, controller: TestController, workspaceId });

  beforeAll(() => {
    SMB_SERVER_MODULE_MANIFESTS.push({
      key: MODULE_KEY,
      applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
      expectedVersion: '0.1.0',
    });
  });

  afterAll(() => {
    SMB_SERVER_MODULE_MANIFESTS.splice(0);
  });

  beforeEach(() => {
    isModuleEnabled.mockReset();
    isModuleEnabled.mockResolvedValue(true);
  });

  it('пропускает обработчик без декоратора, не трогая кэш', async () => {
    const guard = guardWithCache();
    const plainContext = buildExecutionContext({
      handler: () => undefined,
      controller: class PlainController {},
      workspaceId: 'workspace-1',
    });

    await expect(guard.canActivate(plainContext)).resolves.toBe(true);
    expect(isModuleEnabled).not.toHaveBeenCalled();
  });

  it('пропускает, когда App модуля установлен', async () => {
    const guard = guardWithCache();

    await expect(guard.canActivate(context('workspace-1'))).resolves.toBe(true);
    expect(isModuleEnabled).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
    });
  });

  it('отказывает, когда App не установлен или установка не завершена', async () => {
    isModuleEnabled.mockResolvedValue(false);
    const guard = guardWithCache();

    await expect(guard.canActivate(context('workspace-1'))).rejects.toThrow(
      ForbiddenException,
    );
    await expect(guard.canActivate(context('workspace-1'))).rejects.toThrow(
      'выключен в этой компании',
    );
  });

  it('отказывает, если SmbServerModule не подключён (шов P-002)', async () => {
    const guard = new SmbModuleGuard(new Reflector());

    await expect(guard.canActivate(context('workspace-1'))).rejects.toThrow(
      'SmbServerModule не подключён',
    );
  });

  it('отказывает, если ключ не зарегистрирован в registry.ts', async () => {
    class UnregisteredController {
      @RequireSmbModule('ghost')
      handler() {}
    }

    const guard = guardWithCache();

    await expect(
      guard.canActivate(
        buildExecutionContext({
          handler: UnregisteredController.prototype.handler,
          controller: UnregisteredController,
          workspaceId: 'workspace-1',
        }),
      ),
    ).rejects.toThrow('не зарегистрирован');
    expect(isModuleEnabled).not.toHaveBeenCalled();
  });

  it('отказывает запросу без контекста компании', async () => {
    const guard = guardWithCache();

    await expect(guard.canActivate(context(undefined))).rejects.toThrow(
      'без контекста компании',
    );
    expect(isModuleEnabled).not.toHaveBeenCalled();
  });
});
