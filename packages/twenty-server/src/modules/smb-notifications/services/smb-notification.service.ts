import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import {
  SMB_NOTIFICATIONS_CHANNEL,
  SMB_NOTIFICATIONS_DEFAULT_PAGE_SIZE,
  SMB_NOTIFICATIONS_MAX_PAGE_SIZE,
  SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH,
  SMB_NOTIFICATIONS_PAYLOAD_MAX_BYTES,
  SMB_NOTIFICATIONS_READ_RETENTION_DAYS,
} from 'src/modules/smb-notifications/constants/smb-notifications.constants';
import { type SmbNotificationEntity } from 'src/modules/smb-notifications/entities/smb-notification.entity';
import {
  SmbNotificationRepository,
  type SmbNotificationInsertProps,
} from 'src/modules/smb-notifications/repositories/smb-notification.repository';
import { assertSmbNotificationAccess } from 'src/modules/smb-notifications/utils/assert-smb-notification-access.util';

export type NotifySmbNotificationProps = SmbNotificationInsertProps & {
  workspaceId: string;
};

export type NotifyManySmbNotificationsProps = Omit<
  NotifySmbNotificationProps,
  'recipientId'
> & {
  recipientIds: string[];
};

export type SmbNotificationListProps = {
  workspaceId: string;
  recipientId: string;
  limit?: number | undefined;
  offset?: number | undefined;
};

export type SmbNotificationCreatedEvent = {
  event: 'created';
  notification: SmbNotificationEntity;
};

/**
 * Сервис уведомлений (ADR-010 п.6, TODO N-1): любой модуль зовёт
 * `notify(recipient, kind, payload)` и получает строку или `null`, если такое
 * событие этому участнику уже заведено (дедупликация по ключу события).
 *
 * Успешная запись публикуется в наш канал подписок Redis — колокольчик и
 * счётчик в оболочке (N-2) подписываются на `${SMB_NOTIFICATIONS_CHANNEL}:${workspaceId}`.
 */
@Injectable()
export class SmbNotificationService {
  private readonly logger = new Logger(SmbNotificationService.name);

  constructor(
    private readonly smbNotificationRepository: SmbNotificationRepository,
    private readonly redisClientService: RedisClientService,
  ) {}

  async notify(
    props: NotifySmbNotificationProps,
  ): Promise<SmbNotificationEntity | null> {
    const { workspaceId, recipientId } = assertSmbNotificationAccess({
      workspaceId: props.workspaceId,
      workspaceMemberId: props.recipientId,
    });

    const payload = this.assertPayloadSize(props.payload);

    const notification = await this.smbNotificationRepository.insertIfNew(
      workspaceId,
      {
        recipientId,
        kind: props.kind,
        sourceModule: props.sourceModule,
        deduplicationKey: props.deduplicationKey,
        payload,
      },
    );

    if (notification === null) {
      return null;
    }

    await this.publishCreated(notification);

    return notification;
  }

  // Одно событие — много получателей: одна вставка вместо N. Возвращает
  // только реально созданные строки (уже заведённые пропускаются).
  async notifyMany(
    props: NotifyManySmbNotificationsProps,
  ): Promise<SmbNotificationEntity[]> {
    const payload = this.assertPayloadSize(props.payload);

    const recipientIds = [
      ...new Set(
        props.recipientIds.map(
          (recipientId) =>
            assertSmbNotificationAccess({
              workspaceId: props.workspaceId,
              workspaceMemberId: recipientId,
            }).recipientId,
        ),
      ),
    ];

    if (recipientIds.length === 0) {
      return [];
    }

    if (recipientIds.length > SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH) {
      throw new BadRequestException(
        `Получателей в одном вызове: ${recipientIds.length}, максимум ${SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH}. Разбейте список на части.`,
      );
    }

    const notifications = await this.smbNotificationRepository.insertManyIfNew(
      props.workspaceId,
      {
        recipientIds,
        kind: props.kind,
        sourceModule: props.sourceModule,
        deduplicationKey: props.deduplicationKey,
        payload,
      },
    );

    await Promise.all(
      notifications.map((notification) => this.publishCreated(notification)),
    );

    return notifications;
  }

  // Вызывается cron-задачей очистки (AR-10).
  async deleteExpiredRead(): Promise<number> {
    return this.smbNotificationRepository.deleteReadOlderThan(
      SMB_NOTIFICATIONS_READ_RETENTION_DAYS,
    );
  }

  async list(
    props: SmbNotificationListProps,
  ): Promise<SmbNotificationEntity[]> {
    const { workspaceId, recipientId } = assertSmbNotificationAccess({
      workspaceId: props.workspaceId,
      workspaceMemberId: props.recipientId,
    });

    return this.smbNotificationRepository.findManyByRecipient(workspaceId, {
      recipientId,
      limit: this.normalizeLimit(props.limit),
      offset: Math.max(props.offset ?? 0, 0),
    });
  }

  async countUnread(props: {
    workspaceId: string;
    recipientId: string;
  }): Promise<number> {
    const { workspaceId, recipientId } = assertSmbNotificationAccess({
      workspaceId: props.workspaceId,
      workspaceMemberId: props.recipientId,
    });

    return this.smbNotificationRepository.countUnread(workspaceId, recipientId);
  }

  async markAllAsRead(props: {
    workspaceId: string;
    recipientId: string;
  }): Promise<number> {
    const { workspaceId, recipientId } = assertSmbNotificationAccess({
      workspaceId: props.workspaceId,
      workspaceMemberId: props.recipientId,
    });

    return this.smbNotificationRepository.markAllAsRead(
      workspaceId,
      recipientId,
    );
  }

  private assertPayloadSize(
    payload: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    const normalizedPayload = payload ?? {};
    const sizeInBytes = Buffer.byteLength(JSON.stringify(normalizedPayload));

    if (sizeInBytes > SMB_NOTIFICATIONS_PAYLOAD_MAX_BYTES) {
      throw new BadRequestException(
        `Payload уведомления ${sizeInBytes} байт, максимум ${SMB_NOTIFICATIONS_PAYLOAD_MAX_BYTES}: кладите в него ссылку на запись, а не саму запись.`,
      );
    }

    return normalizedPayload;
  }

  private normalizeLimit(limit: number | undefined): number {
    if (limit === undefined) {
      return SMB_NOTIFICATIONS_DEFAULT_PAGE_SIZE;
    }

    return Math.min(Math.max(limit, 1), SMB_NOTIFICATIONS_MAX_PAGE_SIZE);
  }

  // Ошибка публикации не должна отменять уже созданное уведомление:
  // подписчик дозапросит список по счётчику.
  private async publishCreated(
    notification: SmbNotificationEntity,
  ): Promise<void> {
    try {
      await this.redisClientService
        .getPubSubClient()
        .publish(`${SMB_NOTIFICATIONS_CHANNEL}:${notification.workspaceId}`, {
          event: 'created',
          notification,
        } satisfies SmbNotificationCreatedEvent);
    } catch (error) {
      this.logger.warn(
        `Не удалось опубликовать уведомление ${notification.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
