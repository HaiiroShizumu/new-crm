import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { parse } from 'dotenv';
import { DataSource } from 'typeorm';

import { SmbMigrationRunnerService } from 'src/modules/smb-database/services/smb-migration-runner.service';
import { SMB_NOTIFICATIONS_MIGRATIONS } from 'src/modules/smb-notifications/migrations/smb-notifications.migrations';
import { SmbNotificationRepository } from 'src/modules/smb-notifications/repositories/smb-notification.repository';

// Глобальные fake timers из jest.config ломают драйвер pg — здесь нужны реальные.
jest.useRealTimers();

// Тест пишет в живую базу только своими строками: создаёт временную компанию
// и её уведомления, компанию удаляет (уведомления уходят каскадом), за собой
// подчищает. Чужие данные не трогаются. Базу можно переключить переменной
// SMB_NOTIFICATIONS_TEST_DATABASE_URL; по умолчанию — PG_DATABASE_URL из .env.
const readEnvDatabaseUrl = (): string | undefined => {
  try {
    return parse(readFileSync(resolve(__dirname, '../../../../.env')))
      .PG_DATABASE_URL;
  } catch {
    return undefined;
  }
};

const databaseUrl =
  process.env.SMB_NOTIFICATIONS_TEST_DATABASE_URL ?? readEnvDatabaseUrl();

const RECIPIENT_ID = randomUUID();

const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('smb-notifications на PostgreSQL (S7, N-5)', () => {
  let dataSource: DataSource;
  let repository: SmbNotificationRepository;
  let workspaceId: string;
  let workspaceCreated = false;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [],
      synchronize: false,
    });

    await dataSource.initialize();

    await new SmbMigrationRunnerService(dataSource).runPendingMigrations(
      SMB_NOTIFICATIONS_MIGRATIONS,
    );

    repository = new SmbNotificationRepository(dataSource);
    workspaceId = randomUUID();

    // Требования check-ограничений core.workspace: databaseSchema и
    // defaultRoleId обязательны для INACTIVE, workspaceCustomApplicationId — FK.
    await dataSource.query(
      `INSERT INTO core.workspace
         (id, subdomain, "displayName", "databaseSchema", "defaultRoleId", "workspaceCustomApplicationId")
       SELECT $1, $2, 'smb-notifications test', $3, gen_random_uuid(), "workspaceCustomApplicationId"
       FROM core.workspace
       WHERE "workspaceCustomApplicationId" IS NOT NULL
       LIMIT 1`,
      [
        workspaceId,
        `smb-notif-test-${workspaceId.slice(0, 8)}`,
        `workspace_${workspaceId.replace(/-/g, '')}`,
      ],
    );

    const createdRows = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM core.workspace WHERE id = $1`,
      [workspaceId],
    );

    if (createdRows.length !== 1) {
      throw new Error(
        'В базе нет ни одной компании со связанным приложением — тесту не из чего создать временную компанию.',
      );
    }

    workspaceCreated = true;
  }, 60_000);

  afterAll(async () => {
    if (workspaceCreated && dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM core.workspace WHERE id = $1`, [
        workspaceId,
      ]);
      await dataSource.destroy();
    } else if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  const notifyOnce = (deduplicationKey: string) =>
    repository.insertIfNew(workspaceId, {
      recipientId: RECIPIENT_ID,
      kind: 'TASK_ASSIGNED',
      sourceModule: 'smb-tasks',
      deduplicationKey,
      payload: { taskId: 'task-1' },
    });

  it('дедупликация по ключу события держится на уровне БД', async () => {
    const first = await notifyOnce('task-1:assigned');
    const second = await notifyOnce('task-1:assigned');

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('список, счётчик непрочитанных и «прочитать всё»', async () => {
    await notifyOnce('task-2:assigned');
    await notifyOnce('task-3:assigned');

    const list = await repository.findManyByRecipient(workspaceId, {
      recipientId: RECIPIENT_ID,
      limit: 50,
      offset: 0,
    });

    expect(list).toHaveLength(3);

    await repository.markAllAsRead(workspaceId, RECIPIENT_ID);

    expect(await repository.countUnread(workspaceId, RECIPIENT_ID)).toBe(0);

    const rereadCount = await repository.markAllAsRead(
      workspaceId,
      RECIPIENT_ID,
    );

    expect(rereadCount).toBe(0);
  });

  it('insertManyIfNew: одна вставка, повторный ключ пропускается (AR-10)', async () => {
    const recipientIds = [randomUUID(), randomUUID()];
    const props = {
      recipientIds,
      kind: 'POST_IMPORTANT',
      sourceModule: 'smb-feed',
      deduplicationKey: 'post-1:important',
      payload: { postId: 'post-1' },
    };

    const first = await repository.insertManyIfNew(workspaceId, props);
    const second = await repository.insertManyIfNew(workspaceId, props);

    expect(first).toHaveLength(2);
    expect(second).toHaveLength(0);

    await dataSource.query(
      `DELETE FROM "smb"."notification" WHERE "workspaceId" = $1 AND "recipientId" = ANY($2::uuid[])`,
      [workspaceId, recipientIds],
    );
  });

  it('deleteReadOlderThan: удаляет только прочитанное старше срока (AR-10)', async () => {
    const recipientId = randomUUID();
    const insertRow = (deduplicationKey: string, readAtSql: string) =>
      dataSource.query(
        `INSERT INTO "smb"."notification"
           ("recipientId", "kind", "sourceModule", "deduplicationKey", "workspaceId", "readAt")
         VALUES ($1, 'TEST', 'smb-test', $2, $3, ${readAtSql})`,
        [recipientId, deduplicationKey, workspaceId],
      );

    await insertRow('old-read', `now() - interval '40 days'`);
    await insertRow('fresh-read', `now() - interval '1 day'`);
    await insertRow('old-unread', 'NULL');

    const deletedCount = await repository.deleteReadOlderThan(30, workspaceId);

    expect(deletedCount).toBe(1);

    const rows = await dataSource.query<{ deduplicationKey: string }[]>(
      `SELECT "deduplicationKey" FROM "smb"."notification"
       WHERE "workspaceId" = $1 AND "recipientId" = $2
       ORDER BY "deduplicationKey"`,
      [workspaceId, recipientId],
    );

    expect(rows.map((row) => row.deduplicationKey)).toEqual([
      'fresh-read',
      'old-unread',
    ]);

    await dataSource.query(
      `DELETE FROM "smb"."notification" WHERE "workspaceId" = $1 AND "recipientId" = $2`,
      [workspaceId, recipientId],
    );
  });

  it('удаление компании удаляет её уведомления (N-5, каскад по workspaceId)', async () => {
    const notificationsBefore = await repository.findManyByRecipient(
      workspaceId,
      { recipientId: RECIPIENT_ID, limit: 50, offset: 0 },
    );

    expect(notificationsBefore).toHaveLength(3);

    await dataSource.query(`DELETE FROM core.workspace WHERE id = $1`, [
      workspaceId,
    ]);
    workspaceCreated = false;

    const rows = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM "smb"."notification" WHERE "workspaceId" = $1`,
      [workspaceId],
    );

    expect(rows).toHaveLength(0);
  });
});
