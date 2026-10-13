import { Injectable } from '@nestjs/common';

import { isNonEmptyArray } from 'twenty-shared/utils';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { SMB_CONVERSATION_PRESENCE_TTL_SECONDS } from 'src/modules/smb-conversations/constants/smb-conversation-presence-ttl-seconds.constant';

type PresenceTarget = { workspaceId: string; workspaceMemberId: string };

const getPresenceKey = ({ workspaceId, workspaceMemberId }: PresenceTarget) =>
  `smb:conversation:online:${workspaceId}:${workspaceMemberId}`;

// "Online" means "has a live event stream": that person already receives
// messages in the page, so a push notification would be a duplicate.
@Injectable()
export class SmbConversationPresenceService {
  constructor(private readonly redisClientService: RedisClientService) {}

  async markOnline(target: PresenceTarget): Promise<void> {
    await this.redisClientService
      .getClient()
      .set(
        getPresenceKey(target),
        '1',
        'EX',
        SMB_CONVERSATION_PRESENCE_TTL_SECONDS,
      );
  }

  async getOnlineWorkspaceMemberIds({
    workspaceId,
    workspaceMemberIds,
  }: {
    workspaceId: string;
    workspaceMemberIds: string[];
  }): Promise<string[]> {
    if (!isNonEmptyArray(workspaceMemberIds)) {
      return [];
    }

    const values = await this.redisClientService
      .getClient()
      .mget(
        workspaceMemberIds.map((workspaceMemberId) =>
          getPresenceKey({ workspaceId, workspaceMemberId }),
        ),
      );

    return workspaceMemberIds.filter((_, index) => values[index] === '1');
  }
}
