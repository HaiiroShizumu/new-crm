import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import request from 'supertest';

import { type ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { ApplicationState } from 'src/engine/core-modules/application/enums/application-state.enum';
import { type WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { RequireSmbModule } from 'src/modules/smb-modules/decorators/require-smb-module.decorator';
import { SMB_SERVER_MODULE_MANIFESTS } from 'src/modules/smb-modules/registry';
import { SmbInstalledApplicationsCacheService } from 'src/modules/smb-modules/services/smb-installed-applications-cache.service';

const MODULE_KEY = 'tasks';
const APPLICATION_UNIVERSAL_IDENTIFIER = '9b1f0f7a-1c2f-4a1e-9c3e-1f2a3b4c5d6e';
const WORKSPACE_HEADER = 'x-test-workspace-id';

@Controller('smb-guard-test')
class GuardedTestController {
  @Get()
  @RequireSmbModule(MODULE_KEY)
  guarded() {
    return { ok: true };
  }

  @Get('open')
  open() {
    return { ok: true };
  }
}

type ApplicationRow = Pick<
  ApplicationEntity,
  'id' | 'universalIdentifier' | 'version' | 'state' | 'deletedAt'
>;

// AR-9: проверка настоящего guard'а и настоящего кэша по HTTP — без моков
// самого guard'а. Репозиторий App подставлен: состав установленных App —
// единственное, что тест задаёт снаружи.
describe('SmbModuleGuard по HTTP', () => {
  let app: INestApplication;
  let applicationRows: ApplicationRow[];

  const buildRow = (overrides: Partial<ApplicationRow> = {}): ApplicationRow =>
    ({
      id: 'application-1',
      universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
      version: '0.1.0',
      state: ApplicationState.INSTALLED,
      deletedAt: null,
      ...overrides,
    }) as ApplicationRow;

  beforeAll(async () => {
    SMB_SERVER_MODULE_MANIFESTS.push({
      key: MODULE_KEY,
      applicationUniversalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
      expectedVersion: '0.1.0',
    });

    const repository = {
      find: jest.fn(async () => applicationRows),
    } as unknown as WorkspaceScopedRepository<ApplicationEntity>;

    const testingModule = await Test.createTestingModule({
      controllers: [GuardedTestController],
      providers: [
        {
          provide: SmbInstalledApplicationsCacheService,
          useFactory: () =>
            new SmbInstalledApplicationsCacheService(repository),
        },
      ],
    }).compile();

    app = testingModule.createNestApplication();

    // Контекст компании кладёт аутентификация ядра до guard'ов; в тесте его
    // заменяет заголовок.
    app.use((req: Record<string, unknown>, _res: unknown, next: () => void) => {
      const headers = req.headers as Record<string, string | undefined>;

      if (headers[WORKSPACE_HEADER] !== undefined) {
        req.workspaceId = headers[WORKSPACE_HEADER];
      }

      next();
    });

    await app.init();
  });

  afterAll(async () => {
    SMB_SERVER_MODULE_MANIFESTS.splice(0);
    await app.close();
  });

  beforeEach(() => {
    applicationRows = [];
    app.get(SmbInstalledApplicationsCacheService).invalidate();
  });

  it('403, когда App модуля не установлен', async () => {
    await request(app.getHttpServer())
      .get('/smb-guard-test')
      .set(WORKSPACE_HEADER, 'workspace-1')
      .expect(403);
  });

  it('200, когда App установлен и установка завершена', async () => {
    applicationRows = [buildRow()];

    await request(app.getHttpServer())
      .get('/smb-guard-test')
      .set(WORKSPACE_HEADER, 'workspace-1')
      .expect(200, { ok: true });
  });

  it.each([
    ['установка не завершена (version = null)', { version: null }],
    [
      'App удаляется',
      { state: ApplicationState.UNINSTALLING as ApplicationState },
    ],
    ['App снят (soft-delete)', { deletedAt: new Date() }],
  ])('403: %s', async (_name, overrides) => {
    applicationRows = [buildRow(overrides as Partial<ApplicationRow>)];

    await request(app.getHttpServer())
      .get('/smb-guard-test')
      .set(WORKSPACE_HEADER, 'workspace-1')
      .expect(403);
  });

  it('403 без контекста компании', async () => {
    applicationRows = [buildRow()];

    await request(app.getHttpServer()).get('/smb-guard-test').expect(403);
  });

  it('обработчик без декоратора guard не затрагивает', async () => {
    await request(app.getHttpServer()).get('/smb-guard-test/open').expect(200);
  });
});
