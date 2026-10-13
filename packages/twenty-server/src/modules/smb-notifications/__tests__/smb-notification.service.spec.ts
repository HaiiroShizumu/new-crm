import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import {
  SMB_NOTIFICATIONS_CHANNEL,
  SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH,
  SMB_NOTIFICATIONS_PAYLOAD_MAX_BYTES,
  SMB_NOTIFICATIONS_READ_RETENTION_DAYS,
} from 'src/modules/smb-notifications/constants/smb-notifications.constants';
import { type SmbNotificationEntity } from 'src/modules/smb-notifications/entities/smb-notification.entity';
import { SmbNotificationRepository } from 'src/modules/smb-notifications/repositories/smb-notification.repository';
import { SmbNotificationService } from 'src/modules/smb-notifications/services/smb-notification.service';

const WORKSPACE_ID = '20202020-aaaa-4111-8111-111111111111';
const RECIPIENT_ID = '20202020-bbbb-4222-8222-222222222222';

const buildNotification = (
  overrides: Partial<SmbNotificationEntity> = {},
): SmbNotificationEntity =>
  ({
    id: '20202020-cccc-4333-8333-333333333333',
    recipientId: RECIPIENT_ID,
    kind: 'TASK_ASSIGNED',
    sourceModule: 'smb-tasks',
    payload: { taskId: 'task-1' },
    readAt: null,
    deduplicationKey: 'task-1:assigned:20202020-bbbb',
    workspaceId: WORKSPACE_ID,
    createdAt: new Date('2026-10-12T10:00:00Z'),
    updatedAt: new Date('2026-10-12T10:00:00Z'),
    ...overrides,
  }) as SmbNotificationEntity;

const buildService = () => {
  const repository = {
    insertIfNew: jest.fn(),
    insertManyIfNew: jest.fn().mockResolvedValue([]),
    deleteReadOlderThan: jest.fn().mockResolvedValue(0),
    findManyByRecipient: jest.fn().mockResolvedValue([]),
    countUnread: jest.fn().mockResolvedValue(0),
    markAllAsRead: jest.fn().mockResolvedValue(0),
  };
  const publish = jest.fn().mockResolvedValue(undefined);
  const redisClientService = {
    getPubSubClient: () => ({ publish }),
  } as unknown as RedisClientService;

  const service = new SmbNotificationService(
    repository as unknown as SmbNotificationRepository,
    redisClientService,
  );

  return { service, repository, publish };
};

describe('SmbNotificationService.notify', () => {
  it('создаёт уведомление и публикует его в канал компании', async () => {
    const { service, repository, publish } = buildService();
    const notification = buildNotification();

    repository.insertIfNew.mockResolvedValue(notification);

    const result = await service.notify({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
      kind: 'TASK_ASSIGNED',
      sourceModule: 'smb-tasks',
      deduplicationKey: 'task-1:assigned:20202020-bbbb',
      payload: { taskId: 'task-1' },
    });

    expect(result).toEqual(notification);
    expect(repository.insertIfNew).toHaveBeenCalledWith(WORKSPACE_ID, {
      recipientId: RECIPIENT_ID,
      kind: 'TASK_ASSIGNED',
      sourceModule: 'smb-tasks',
      deduplicationKey: 'task-1:assigned:20202020-bbbb',
      payload: { taskId: 'task-1' },
    });
    expect(publish).toHaveBeenCalledWith(
      `${SMB_NOTIFICATIONS_CHANNEL}:${WORKSPACE_ID}`,
      { event: 'created', notification },
    );
  });

  it('дедупликация: повторный ключ события не создаёт строку и не публикуется', async () => {
    const { service, repository, publish } = buildService();

    repository.insertIfNew.mockResolvedValue(null);

    const result = await service.notify({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
      kind: 'TASK_ASSIGNED',
      sourceModule: 'smb-tasks',
      deduplicationKey: 'task-1:assigned:20202020-bbbb',
      payload: { taskId: 'task-1' },
    });

    expect(result).toBeNull();
    expect(publish).not.toHaveBeenCalled();
  });

  it('падение публикации не отменяет созданное уведомление', async () => {
    const { service, repository, publish } = buildService();

    repository.insertIfNew.mockResolvedValue(buildNotification());
    publish.mockRejectedValue(new Error('redis down'));

    await expect(
      service.notify({
        workspaceId: WORKSPACE_ID,
        recipientId: RECIPIENT_ID,
        kind: 'TASK_ASSIGNED',
        sourceModule: 'smb-tasks',
        deduplicationKey: 'task-1:assigned:20202020-bbbb',
        payload: {},
      }),
    ).resolves.toEqual(expect.objectContaining({ id: expect.any(String) }));
  });

  it('без компании или участника — отказ по единственной функции проверки', async () => {
    const { service, repository } = buildService();

    await expect(
      service.notify({
        workspaceId: '',
        recipientId: RECIPIENT_ID,
        kind: 'TASK_ASSIGNED',
        sourceModule: 'smb-tasks',
        deduplicationKey: 'key',
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.notify({
        workspaceId: WORKSPACE_ID,
        recipientId: '',
        kind: 'TASK_ASSIGNED',
        sourceModule: 'smb-tasks',
        deduplicationKey: 'key',
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.insertIfNew).not.toHaveBeenCalled();
  });
});

describe('SmbNotificationService: список, счётчик, «прочитать всё»', () => {
  it('каждый запрос проходит пару (workspaceId, recipientId)', async () => {
    const { service, repository } = buildService();

    await service.list({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
    });
    await service.countUnread({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
    });
    await service.markAllAsRead({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
    });

    expect(repository.findManyByRecipient).toHaveBeenCalledWith(
      WORKSPACE_ID,
      expect.objectContaining({ recipientId: RECIPIENT_ID }),
    );
    expect(repository.countUnread).toHaveBeenCalledWith(
      WORKSPACE_ID,
      RECIPIENT_ID,
    );
    expect(repository.markAllAsRead).toHaveBeenCalledWith(
      WORKSPACE_ID,
      RECIPIENT_ID,
    );
  });

  it('ограничивает размер страницы', async () => {
    const { service, repository } = buildService();

    await service.list({
      workspaceId: WORKSPACE_ID,
      recipientId: RECIPIENT_ID,
      limit: 1000,
      offset: -5,
    });

    expect(repository.findManyByRecipient).toHaveBeenCalledWith(
      WORKSPACE_ID,
      expect.objectContaining({ limit: 100, offset: 0 }),
    );
  });
});

describe('SmbNotificationService: лимит payload (AR-10)', () => {
  const oversizedPayload = {
    text: 'x'.repeat(SMB_NOTIFICATIONS_PAYLOAD_MAX_BYTES),
  };

  it('notify отказывает на слишком большом payload и ничего не пишет', async () => {
    const { service, repository } = buildService();

    await expect(
      service.notify({
        workspaceId: WORKSPACE_ID,
        recipientId: RECIPIENT_ID,
        kind: 'TASK_ASSIGNED',
        sourceModule: 'smb-tasks',
        deduplicationKey: 'key',
        payload: oversizedPayload,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.insertIfNew).not.toHaveBeenCalled();
  });

  it('notifyMany отказывает на слишком большом payload', async () => {
    const { service, repository } = buildService();

    await expect(
      service.notifyMany({
        workspaceId: WORKSPACE_ID,
        recipientIds: [RECIPIENT_ID],
        kind: 'TASK_ASSIGNED',
        sourceModule: 'smb-tasks',
        deduplicationKey: 'key',
        payload: oversizedPayload,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.insertManyIfNew).not.toHaveBeenCalled();
  });
});

describe('SmbNotificationService.notifyMany (AR-10)', () => {
  const OTHER_RECIPIENT_ID = '20202020-dddd-4444-8444-444444444444';

  it('одна вставка на всех получателей, дубли в списке схлопываются', async () => {
    const { service, repository, publish } = buildService();
    const created = [
      buildNotification({ recipientId: RECIPIENT_ID }),
      buildNotification({ recipientId: OTHER_RECIPIENT_ID }),
    ];

    repository.insertManyIfNew.mockResolvedValue(created);

    const result = await service.notifyMany({
      workspaceId: WORKSPACE_ID,
      recipientIds: [RECIPIENT_ID, OTHER_RECIPIENT_ID, RECIPIENT_ID],
      kind: 'POST_IMPORTANT',
      sourceModule: 'smb-feed',
      deduplicationKey: 'post-1',
      payload: { postId: 'post-1' },
    });

    expect(result).toEqual(created);
    expect(repository.insertManyIfNew).toHaveBeenCalledTimes(1);
    expect(repository.insertManyIfNew).toHaveBeenCalledWith(WORKSPACE_ID, {
      recipientIds: [RECIPIENT_ID, OTHER_RECIPIENT_ID],
      kind: 'POST_IMPORTANT',
      sourceModule: 'smb-feed',
      deduplicationKey: 'post-1',
      payload: { postId: 'post-1' },
    });
    expect(publish).toHaveBeenCalledTimes(2);
  });

  it('пустой список получателей — без обращения к БД', async () => {
    const { service, repository } = buildService();

    await expect(
      service.notifyMany({
        workspaceId: WORKSPACE_ID,
        recipientIds: [],
        kind: 'POST_IMPORTANT',
        sourceModule: 'smb-feed',
        deduplicationKey: 'post-1',
        payload: {},
      }),
    ).resolves.toEqual([]);

    expect(repository.insertManyIfNew).not.toHaveBeenCalled();
  });

  it('отказывает без компании и при пустом id получателя', async () => {
    const { service, repository } = buildService();

    await expect(
      service.notifyMany({
        workspaceId: '',
        recipientIds: [RECIPIENT_ID],
        kind: 'POST_IMPORTANT',
        sourceModule: 'smb-feed',
        deduplicationKey: 'post-1',
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.notifyMany({
        workspaceId: WORKSPACE_ID,
        recipientIds: [RECIPIENT_ID, ''],
        kind: 'POST_IMPORTANT',
        sourceModule: 'smb-feed',
        deduplicationKey: 'post-1',
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(repository.insertManyIfNew).not.toHaveBeenCalled();
  });

  it('отказывает, когда получателей больше предела пакета', async () => {
    const { service, repository } = buildService();
    const recipientIds = Array.from(
      { length: SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH + 1 },
      (_, index) =>
        `20202020-eeee-4555-8555-${String(index).padStart(12, '0')}`,
    );

    await expect(
      service.notifyMany({
        workspaceId: WORKSPACE_ID,
        recipientIds,
        kind: 'POST_IMPORTANT',
        sourceModule: 'smb-feed',
        deduplicationKey: 'post-1',
        payload: {},
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.insertManyIfNew).not.toHaveBeenCalled();
  });
});

describe('SmbNotificationService.deleteExpiredRead (AR-10)', () => {
  it('передаёт в репозиторий срок хранения прочитанного', async () => {
    const { service, repository } = buildService();

    repository.deleteReadOlderThan.mockResolvedValue(7);

    await expect(service.deleteExpiredRead()).resolves.toBe(7);
    expect(repository.deleteReadOlderThan).toHaveBeenCalledWith(
      SMB_NOTIFICATIONS_READ_RETENTION_DAYS,
    );
  });
});
