import { Injectable } from '@nestjs/common';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { type SmbConversationEventDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-event.dto';
import { type SmbConversationEventPayload } from 'src/modules/smb-conversations/types/smb-conversation-event-payload.type';
import { getSmbConversationRedisTopic } from 'src/modules/smb-conversations/utils/get-smb-conversation-redis-topic.util';

@Injectable()
export class SmbConversationEventPublisherService {
  constructor(private readonly redisClientService: RedisClientService) {}

  async publishToMember({
    workspaceId,
    workspaceMemberId,
    event,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    event: SmbConversationEventDTO;
  }): Promise<void> {
    const payload: SmbConversationEventPayload = { onMessengerEvent: event };

    await this.redisClientService
      .getPubSubClient()
      .publish(
        getSmbConversationRedisTopic({ workspaceId, workspaceMemberId }),
        payload,
      );
  }

  async publishToMembers({
    workspaceId,
    workspaceMemberIds,
    event,
  }: {
    workspaceId: string;
    workspaceMemberIds: string[];
    event: SmbConversationEventDTO;
  }): Promise<void> {
    await Promise.all(
      workspaceMemberIds.map((workspaceMemberId) =>
        this.publishToMember({ workspaceId, workspaceMemberId, event }),
      ),
    );
  }

  subscribe({
    workspaceId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
  }): AsyncIterableIterator<SmbConversationEventPayload> {
    return this.redisClientService
      .getPubSubClient()
      .asyncIterator<SmbConversationEventPayload>(
        getSmbConversationRedisTopic({ workspaceId, workspaceMemberId }),
      );
  }
}
