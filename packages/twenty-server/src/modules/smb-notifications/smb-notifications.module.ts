import { Module } from '@nestjs/common';

import { SmbNotificationsCleanupCronJob } from 'src/modules/smb-notifications/crons/jobs/smb-notifications-cleanup.cron.job';
import { SmbNotificationResolver } from 'src/modules/smb-notifications/resolvers/smb-notification.resolver';
import { SmbNotificationRepository } from 'src/modules/smb-notifications/repositories/smb-notification.repository';
import { SmbNotificationService } from 'src/modules/smb-notifications/services/smb-notification.service';
import { SmbNotificationsCleanupSchedulerService } from 'src/modules/smb-notifications/services/smb-notifications-cleanup-scheduler.service';

/**
 * `smb-notifications` — платформенный модуль уведомлений (ADR-010 п.6).
 *
 * Регистрируется в агрегаторе `src/modules/smb-server.module.ts` (шов P-002
 * в `CoreEngineModule` — поэтому резолвер входит в схему `/graphql`, ADR-013 п.1).
 * `RedisClientService` даёт @Global()-модуль, DataSource — глобальный TypeORM.
 * Таблица создаётся миграцией из `migrations/` (ADR-013 п.2). Прочитанное
 * старше срока удаляет ежедневная cron-задача (AR-10).
 */
@Module({
  providers: [
    SmbNotificationRepository,
    SmbNotificationService,
    SmbNotificationResolver,
    SmbNotificationsCleanupCronJob,
    SmbNotificationsCleanupSchedulerService,
  ],
  exports: [SmbNotificationService],
})
export class SmbNotificationsModule {}
