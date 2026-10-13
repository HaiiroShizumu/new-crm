import { UseFilters, UseGuards } from '@nestjs/common';
import { Subscription } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { AuthGraphqlApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-graphql-api-exception.filter';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { SMB_CONVERSATION_KEEPALIVE_INTERVAL_MS } from 'src/modules/smb-conversations/constants/smb-conversation-keepalive-interval-ms.constant';
import { SmbConversationEventDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-event.dto';
import { SmbConversationEventType } from 'src/modules/smb-conversations/enums/smb-conversation-event-type.enum';
import { SmbConversationEventPublisherService } from 'src/modules/smb-conversations/services/smb-conversation-event-publisher.service';
import { SmbConversationPresenceService } from 'src/modules/smb-conversations/services/smb-conversation-presence.service';
import { SmbConversationsExceptionFilter } from 'src/modules/smb-conversations/smb-conversations-exception.filter';
import { type SmbConversationEventPayload } from 'src/modules/smb-conversations/types/smb-conversation-event-payload.type';
import { assertSmbWorkspaceMemberId } from 'src/modules/smb-conversations/utils/assert-smb-workspace-member-id.util';
import { reviveSmbConversationEventDates } from 'src/modules/smb-conversations/utils/revive-smb-conversation-event-dates.util';
import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthWorkspaceMemberId } from 'src/engine/decorators/auth/auth-workspace-member-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { wrapAsyncIteratorWithLifecycle } from 'src/engine/subscriptions/utils/wrap-async-iterator-with-lifecycle';

// Только люди. Сеансы имперсонации не допускаются намеренно: поддержка,
// вошедшая «как пользователь», не должна читать и писать его переписку.
@CoreResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: false,
      playground: false,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
  NoPermissionGuard,
)
@UseFilters(
  SmbConversationsExceptionFilter,
  PreventNestToAutoLogGraphqlErrorsFilter,
  AuthGraphqlApiExceptionFilter,
)
export class SmbConversationSubscriptionResolver {
  constructor(
    private readonly eventPublisherService: SmbConversationEventPublisherService,
    private readonly presenceService: SmbConversationPresenceService,
  ) {}

  // One stream per person, not per conversation: the server decides what a member
  // may see by publishing only to members, so the client has nothing to ask for.
  @Subscription(() => SmbConversationEventDTO, {
    resolve: (payload: SmbConversationEventPayload) =>
      reviveSmbConversationEventDates(payload.onMessengerEvent),
  })
  async onMessengerEvent(
    @AuthWorkspace() workspace: WorkspaceEntity,
    @AuthWorkspaceMemberId() workspaceMemberId: string | undefined,
  ): Promise<AsyncIterableIterator<SmbConversationEventPayload>> {
    assertSmbWorkspaceMemberId(workspaceMemberId);

    const keepaliveEvent = { type: SmbConversationEventType.KEEPALIVE };
    const presenceTarget = { workspaceId: workspace.id, workspaceMemberId };

    await this.presenceService.markOnline(presenceTarget);

    return wrapAsyncIteratorWithLifecycle(
      () =>
        this.eventPublisherService.subscribe({
          workspaceId: workspace.id,
          workspaceMemberId,
        }),
      {
        initialValue: { onMessengerEvent: keepaliveEvent },
        // Proxies drop an SSE response that stays silent; the keepalive also
        // tells the client the stream is alive, so it can detect a dead one.
        onHeartbeat: async () => {
          await this.presenceService.markOnline(presenceTarget);
          await this.eventPublisherService.publishToMember({
            workspaceId: workspace.id,
            workspaceMemberId,
            event: keepaliveEvent,
          });

          return true;
        },
        heartbeatIntervalMs: SMB_CONVERSATION_KEEPALIVE_INTERVAL_MS,
      },
    );
  }
}
