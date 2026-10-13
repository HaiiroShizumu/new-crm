import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { SmbConversationRepository } from 'src/modules/smb-conversations/repositories/smb-conversation.repository';
import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';
import { type SmbConversationMemberRow } from 'src/modules/smb-conversations/types/smb-conversation-member-row.type';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

@Injectable()
export class SmbConversationAccessService {
  constructor(
    private readonly conversationRepository: SmbConversationRepository,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
  ) {}

  // С этого начинается каждая операция с беседой: объектные права не умеют
  // «только участники», поэтому правило доступа — членство (ADR-010 п.2).
  async getMembershipOrThrow({
    workspaceId,
    conversationId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    conversationId: string;
    workspaceMemberId: string;
  }): Promise<SmbConversationMemberRow> {
    const membership = await this.conversationRepository.findMembership(
      workspaceId,
      conversationId,
      workspaceMemberId,
    );

    if (!isDefined(membership)) {
      throw new SmbConversationsException(
        `Workspace member ${workspaceMemberId} is not a member of conversation ${conversationId}`,
        SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND,
      );
    }

    return membership;
  }

  getConversationMembers({
    workspaceId,
    conversationId,
  }: {
    workspaceId: string;
    conversationId: string;
  }): Promise<SmbConversationMemberRow[]> {
    return this.conversationRepository.findMembers(workspaceId, [
      conversationId,
    ]);
  }

  async assertWorkspaceMembersExist({
    workspaceId,
    workspaceMemberIds,
  }: {
    workspaceId: string;
    workspaceMemberIds: string[];
  }): Promise<void> {
    const existingWorkspaceMembers =
      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const workspaceMemberRepository =
          this.workspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
            'workspaceMember',
            { shouldBypassPermissionChecks: true },
          );

        return workspaceMemberRepository.find({
          where: { id: In(workspaceMemberIds) },
          select: { id: true },
        });
      }, buildSystemAuthContext(workspaceId));

    const existingWorkspaceMemberIds = new Set(
      existingWorkspaceMembers.map((workspaceMember) => workspaceMember.id),
    );
    const missingWorkspaceMemberId = workspaceMemberIds.find(
      (workspaceMemberId) => !existingWorkspaceMemberIds.has(workspaceMemberId),
    );

    if (isDefined(missingWorkspaceMemberId)) {
      throw new SmbConversationsException(
        `Workspace member ${missingWorkspaceMemberId} not found`,
        SmbConversationsExceptionCode.WORKSPACE_MEMBER_NOT_FOUND,
      );
    }
  }

  async getWorkspaceMemberDisplayName({
    workspaceId,
    workspaceMemberId,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
  }): Promise<string | null> {
    const workspaceMember =
      await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
        const workspaceMemberRepository =
          this.workspaceOrmManager.getRepository<WorkspaceMemberWorkspaceEntity>(
            'workspaceMember',
            { shouldBypassPermissionChecks: true },
          );

        return workspaceMemberRepository.findOne({
          where: { id: workspaceMemberId },
        });
      }, buildSystemAuthContext(workspaceId));

    const displayName = [
      workspaceMember?.name?.firstName,
      workspaceMember?.name?.lastName,
    ]
      .filter(isNonEmptyString)
      .join(' ');

    return displayName.length > 0 ? displayName : null;
  }
}
