import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { SMB_NOTIFICATIONS_CLEANUP_CRON_PATTERN } from 'src/modules/smb-notifications/constants/smb-notifications.constants';
import { SmbNotificationsCleanupCronJob } from 'src/modules/smb-notifications/crons/jobs/smb-notifications-cleanup.cron.job';

// Штатные cron-задачи ядра регистрирует команда `cron:*` из общего списка
// (файл ядра). Своей строки в нём форк не добавляет (ADR-009 п.4), поэтому
// повторяющаяся задача ставится при старте: у BullMQ она идемпотентна по
// имени и расписанию, повторная регистрация из сервера и воркера безвредна.
@Injectable()
export class SmbNotificationsCleanupSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(
    SmbNotificationsCleanupSchedulerService.name,
  );

  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.messageQueueService.addCron<undefined>({
        jobName: SmbNotificationsCleanupCronJob.name,
        data: undefined,
        options: {
          repeat: { pattern: SMB_NOTIFICATIONS_CLEANUP_CRON_PATTERN },
        },
      });
    } catch (error) {
      // Очистка — обслуживание, а не условие работы: сервер стартует и без неё.
      this.logger.warn(
        `Не удалось поставить cron очистки уведомлений: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
