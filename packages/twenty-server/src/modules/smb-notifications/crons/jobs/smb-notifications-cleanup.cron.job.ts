import { Injectable, Logger } from '@nestjs/common';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { SMB_NOTIFICATIONS_CLEANUP_CRON_PATTERN } from 'src/modules/smb-notifications/constants/smb-notifications.constants';
import { SmbNotificationService } from 'src/modules/smb-notifications/services/smb-notification.service';

@Injectable()
@Processor(MessageQueue.cronQueue)
export class SmbNotificationsCleanupCronJob {
  private readonly logger = new Logger(SmbNotificationsCleanupCronJob.name);

  constructor(
    private readonly smbNotificationService: SmbNotificationService,
  ) {}

  @Process(SmbNotificationsCleanupCronJob.name)
  @SentryCronMonitor(
    SmbNotificationsCleanupCronJob.name,
    SMB_NOTIFICATIONS_CLEANUP_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const deletedCount = await this.smbNotificationService.deleteExpiredRead();

    if (deletedCount > 0) {
      this.logger.log(`Удалено прочитанных уведомлений: ${deletedCount}`);
    }
  }
}
