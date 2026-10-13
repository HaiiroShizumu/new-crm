import { Module } from '@nestjs/common';

import { SmbConversationRepository } from 'src/modules/smb-conversations/repositories/smb-conversation.repository';
import { SmbConversationSubscriptionResolver } from 'src/modules/smb-conversations/resolvers/smb-conversation-subscription.resolver';
import { SmbConversationResolver } from 'src/modules/smb-conversations/resolvers/smb-conversation.resolver';
import { SmbConversationAccessService } from 'src/modules/smb-conversations/services/smb-conversation-access.service';
import { SmbConversationEventPublisherService } from 'src/modules/smb-conversations/services/smb-conversation-event-publisher.service';
import { SmbConversationMessageService } from 'src/modules/smb-conversations/services/smb-conversation-message.service';
import { SmbConversationPresenceService } from 'src/modules/smb-conversations/services/smb-conversation-presence.service';
import { SmbConversationService } from 'src/modules/smb-conversations/services/smb-conversation.service';

/**
 * `smb-conversations` — беседы и мессенджер (ADR-010 п.1–3).
 *
 * Платформенный модуль, как `smb-notifications`: у него нет App-выключателя,
 * мессенджер есть в каждой компании. Таблицы — `smb.conversation*`, создаются
 * миграцией из `migrations/` (ADR-013 п.2). `RedisClientService`, DataSource и
 * `WorkspaceOrmManager` приходят из глобальных модулей ядра.
 */
@Module({
  providers: [
    SmbConversationRepository,
    SmbConversationAccessService,
    SmbConversationEventPublisherService,
    SmbConversationPresenceService,
    SmbConversationService,
    SmbConversationMessageService,
    SmbConversationResolver,
    SmbConversationSubscriptionResolver,
  ],
  exports: [
    SmbConversationAccessService,
    SmbConversationService,
    SmbConversationMessageService,
    SmbConversationPresenceService,
  ],
})
export class SmbConversationsModule {}
