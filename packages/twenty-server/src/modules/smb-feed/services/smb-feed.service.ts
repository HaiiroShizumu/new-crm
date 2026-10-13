import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import {
  FEED_ACKNOWLEDGEMENT_OBJECT_NAME,
  FEED_IMPORTANT_POST_NOTIFICATION_KIND,
  FEED_NOTIFICATION_SOURCE_MODULE,
  FEED_POST_OBJECT_NAME,
  WORKSPACE_MEMBER_OBJECT_NAME,
} from 'src/modules/smb-feed/constants/feed.constants';
import {
  findUnacknowledgedMemberIds,
  resolveAudienceMemberIds,
} from 'src/modules/smb-feed/utils/resolve-audience-member-ids.util';
import { SmbNotificationService } from 'src/modules/smb-notifications/services/smb-notification.service';
import { SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH } from 'src/modules/smb-notifications/constants/smb-notifications.constants';

type FeedPostRecord = {
  id: string;
  title?: string | null;
  audience?: string | null;
  audienceDepartmentIds?: string[] | null;
  isImportant?: boolean | null;
  authorId?: string | null;
};

type MemberRecord = { id: string; departmentId?: string | null };
type AcknowledgementRecord = { memberId?: string | null };

@Injectable()
export class SmbFeedService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly smbNotificationService: SmbNotificationService,
  ) {}

  // F-4: уведомление аудитории о важном посте. Повторный вызов безопасен:
  // дедупликация по ключу события на стороне уведомлений.
  async notifyImportantPostAudience(
    authContext: WorkspaceAuthContext,
    post: FeedPostRecord,
  ): Promise<number> {
    const workspaceId = authContext.workspace?.id;

    if (!isDefined(workspaceId) || post.isImportant !== true) {
      return 0;
    }

    const recipientIds = await this.resolveAudience(authContext, post);
    let createdCount = 0;

    for (
      let offset = 0;
      offset < recipientIds.length;
      offset += SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH
    ) {
      const created = await this.smbNotificationService.notifyMany({
        workspaceId,
        recipientIds: recipientIds.slice(
          offset,
          offset + SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH,
        ),
        kind: FEED_IMPORTANT_POST_NOTIFICATION_KIND,
        sourceModule: FEED_NOTIFICATION_SOURCE_MODULE,
        deduplicationKey: `feed-post:${post.id}:important`,
        payload: { postId: post.id, title: post.title ?? '' },
      });

      createdCount += created.length;
    }

    return createdCount;
  }

  // F-4: кто из аудитории не нажал «Ознакомлен».
  async listUnacknowledgedMemberIds(
    authContext: WorkspaceAuthContext,
    postId: string,
  ): Promise<string[]> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const postRepository =
        this.workspaceOrmManager.getRepository<FeedPostRecord>(
          FEED_POST_OBJECT_NAME,
          { shouldBypassPermissionChecks: true },
        );
      const post = await postRepository.findOne({ where: { id: postId } });

      if (!isDefined(post)) {
        return [];
      }

      const acknowledgementRepository =
        this.workspaceOrmManager.getRepository<AcknowledgementRecord>(
          FEED_ACKNOWLEDGEMENT_OBJECT_NAME,
          { shouldBypassPermissionChecks: true },
        );
      const acknowledgements = await acknowledgementRepository.find({
        where: { postId },
      });

      return findUnacknowledgedMemberIds({
        audienceMemberIds: await this.loadAudience(post),
        acknowledgedMemberIds: acknowledgements
          .map((record) => record.memberId)
          .filter(isDefined),
      });
    }, authContext);
  }

  private async resolveAudience(
    authContext: WorkspaceAuthContext,
    post: FeedPostRecord,
  ): Promise<string[]> {
    return this.workspaceOrmManager.executeInWorkspaceContext(
      () => this.loadAudience(post),
      authContext,
    );
  }

  private async loadAudience(post: FeedPostRecord): Promise<string[]> {
    const memberRepository =
      this.workspaceOrmManager.getRepository<MemberRecord>(
        WORKSPACE_MEMBER_OBJECT_NAME,
        { shouldBypassPermissionChecks: true },
      );
    const members = await memberRepository.find({});

    return resolveAudienceMemberIds({
      audience: post.audience,
      audienceDepartmentIds: post.audienceDepartmentIds,
      authorId: post.authorId,
      members: members.map((member) => ({
        id: member.id,
        departmentId: member.departmentId ?? null,
      })),
    });
  }
}
