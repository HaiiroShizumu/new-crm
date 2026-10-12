import { type DataSource } from 'typeorm';

import { SmbMigrationRunnerService } from 'src/modules/smb-database/services/smb-migration-runner.service';
import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

type FakeDatabase = {
  isCoreReady: boolean;
  appliedNames: string[];
  statements: string[];
};

const buildRunner = (database: FakeDatabase) => {
  let pendingInsertName: string | null = null;

  const queryRunner = {
    connect: jest.fn(),
    release: jest.fn(),
    startTransaction: jest.fn(async () => {
      database.statements.push('BEGIN');
    }),
    commitTransaction: jest.fn(async () => {
      if (pendingInsertName !== null) {
        database.appliedNames.push(pendingInsertName);
        pendingInsertName = null;
      }
      database.statements.push('COMMIT');
    }),
    rollbackTransaction: jest.fn(async () => {
      pendingInsertName = null;
      database.statements.push('ROLLBACK');
    }),
    query: jest.fn(async (sql: string, parameters?: unknown[]) => {
      database.statements.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));

      if (sql.includes('to_regclass')) {
        return [{ isCoreReady: database.isCoreReady }];
      }

      if (sql.startsWith('SELECT "name"')) {
        return database.appliedNames.map((name) => ({ name }));
      }

      if (sql.startsWith('INSERT INTO "smb"."_migration"')) {
        pendingInsertName = String(parameters?.[0]);
      }

      return [];
    }),
  };

  const dataSource = {
    createQueryRunner: () => queryRunner,
  } as unknown as DataSource;

  return { service: new SmbMigrationRunnerService(dataSource), queryRunner };
};

const buildMigration = (name: string, up = jest.fn()): SmbMigration => ({
  name,
  up,
});

describe('SmbMigrationRunnerService', () => {
  it('применяет только те миграции, которых нет в журнале, в порядке реестра', async () => {
    const database: FakeDatabase = {
      isCoreReady: true,
      appliedNames: ['notifications/0001-create'],
      statements: [],
    };
    const { service } = buildRunner(database);
    const alreadyApplied = buildMigration('notifications/0001-create');
    const first = buildMigration('conversations/0001-create');
    const second = buildMigration('conversations/0002-add-index');

    const executedNames = await service.runPendingMigrations([
      alreadyApplied,
      first,
      second,
    ]);

    expect(executedNames).toEqual([
      'conversations/0001-create',
      'conversations/0002-add-index',
    ]);
    expect(alreadyApplied.up).not.toHaveBeenCalled();
    expect(database.appliedNames).toEqual([
      'notifications/0001-create',
      'conversations/0001-create',
      'conversations/0002-add-index',
    ]);
  });

  it('применяет миграцию, добавленную раньше уже применённых — учёт по имени, не по позиции', async () => {
    const database: FakeDatabase = {
      isCoreReady: true,
      appliedNames: ['tasks/0001-create'],
      statements: [],
    };
    const { service } = buildRunner(database);
    const insertedBefore = buildMigration('notifications/0002-add-column');

    const executedNames = await service.runPendingMigrations([
      insertedBefore,
      buildMigration('tasks/0001-create'),
    ]);

    expect(executedNames).toEqual(['notifications/0002-add-column']);
    expect(insertedBefore.up).toHaveBeenCalledTimes(1);
  });

  it('повторный запуск ничего не делает', async () => {
    const database: FakeDatabase = {
      isCoreReady: true,
      appliedNames: [],
      statements: [],
    };
    const { service } = buildRunner(database);
    const migration = buildMigration('notifications/0001-create');

    await service.runPendingMigrations([migration]);
    const secondRunExecutedNames = await service.runPendingMigrations([
      migration,
    ]);

    expect(secondRunExecutedNames).toEqual([]);
    expect(migration.up).toHaveBeenCalledTimes(1);
  });

  it('откатывает упавшую миграцию, не пишет её в журнал, останавливается и снимает блокировку', async () => {
    const database: FakeDatabase = {
      isCoreReady: true,
      appliedNames: [],
      statements: [],
    };
    const { service, queryRunner } = buildRunner(database);
    const failing = buildMigration(
      'notifications/0001-create',
      jest.fn().mockRejectedValue(new Error('relation already exists')),
    );
    const next = buildMigration('notifications/0002-add-column');

    await expect(service.runPendingMigrations([failing, next])).rejects.toThrow(
      "Миграция форка 'notifications/0001-create' не применена: relation already exists",
    );

    expect(next.up).not.toHaveBeenCalled();
    expect(database.appliedNames).toEqual([]);
    expect(database.statements).toContain('ROLLBACK');
    expect(database.statements[database.statements.length - 1]).toBe(
      'SELECT pg_advisory_unlock($1)',
    );
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('на базе без схемы core ничего не создаёт и не падает', async () => {
    const database: FakeDatabase = {
      isCoreReady: false,
      appliedNames: [],
      statements: [],
    };
    const { service } = buildRunner(database);
    const migration = buildMigration('notifications/0001-create');

    const executedNames = await service.runPendingMigrations([migration]);

    expect(executedNames).toEqual([]);
    expect(migration.up).not.toHaveBeenCalled();
    expect(
      database.statements.some((statement) => statement.startsWith('CREATE')),
    ).toBe(false);
  });

  it('отказывается стартовать при повторяющемся имени миграции', async () => {
    const database: FakeDatabase = {
      isCoreReady: true,
      appliedNames: [],
      statements: [],
    };
    const { service } = buildRunner(database);

    await expect(
      service.runPendingMigrations([
        buildMigration('notifications/0001-create'),
        buildMigration('notifications/0001-create'),
      ]),
    ).rejects.toThrow('повторяется в реестре');
  });
});
