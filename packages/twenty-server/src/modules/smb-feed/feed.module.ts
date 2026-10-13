import { Module } from '@nestjs/common';

import { FeedPostImportantPostQueryHook } from 'src/modules/smb-feed/hooks/feed-post-important.post-query.hook';
import { SmbFeedService } from 'src/modules/smb-feed/services/smb-feed.service';
import { SmbNotificationsModule } from 'src/modules/smb-notifications/smb-notifications.module';

// Серверная часть модуля 'feed': уведомление аудитории о «важном» посте и
// список не ознакомившихся (F-4). Автопосты (F-5) — не сделаны.
@Module({
  imports: [SmbNotificationsModule],
  providers: [SmbFeedService, FeedPostImportantPostQueryHook],
  exports: [SmbFeedService],
})
export class SmbFeedModule {}
