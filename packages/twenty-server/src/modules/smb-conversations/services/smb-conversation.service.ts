import { Injectable, Logger } from '@nestjs/common';

import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { SMB_CONVERSATION_GROUP_MAX_MEMBERS } from 'src/modules/smb-conversations/constants/smb-conversation-group-max-members.constant';
import { type SmbConversationEventDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-event.dto';
import { type SmbConversationDTO } from 'src/modules/smb-conversations/dtos/smb-conversation.dto';
import { SmbConversationEventType } from 'src/modules/smb-conversations/enums/smb-conversation-event-type.enum';
import { SmbConversationKind } from 'src/modules/smb-conversations/enums/smb-conversation-kind.enum';
import { SmbConversationRepository } from 'src/modules/smb-conversations/repositories/smb-conversation.repository';
import { SmbConversationAccessService } from 'src/modules/smb-conversations/services/smb-conversation-access.service';
import { SmbConversationEventPublisherService } from 'src/modules/smb-conversations/services/smb-conversation-event-publisher.service';
import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';
import { type SmbConversationRow } from 'src/modules/smb-conversations/types/smb-conversation-row.type';
import { buildSmbConversationDto } from 'src/modules/smb-conversations/utils/build-smb-conversation-dto.util';
import { buildSmbDirectKey } from 'src/modules/smb-conversations/utils/build-smb-direct-key.util';

type ConversationViewer = { workspaceId: string; workspaceMemberId: string };

@Injectable()
export class SmbConversationService {
  private readonly logger = new Logger(SmbConversationService.name);

  constructor(
    private readonly conversationRepository: SmbConversationRepository,
    private readonly accessService: SmbConversationAccessService,
    private readonly eventPublisherService: SmbConversationEventPublisherService,
  ) {}

  async getConversations({
    workspaceId,
    workspaceMemberId,
  }: ConversationViewer): Promise<SmbConversationDTO[]> {
    const memberships =
      await this.conversationRepository.findMembershipsOfWorkspaceMember(
        workspaceId,
        workspaceMemberId,
      );

    if (!isNonEmptyArray(memberships)) {
      return [];
    }

    const conversationIds = memberships.map(
      (membership) => membership.conversationId,
    );

    const [conversations, members, lastMessages] = await Promise.all([
      this.conversationRepository.findConversationsByIds(
        workspaceId,
        conversationIds,
      ),
      this.conversationRepository.findMembers(workspaceId, conversationIds),
      this.conversationRepository.findLastMessages(
        workspaceId,
        conversationIds,
      ),
    ]);

    const lastMessageByConversationId = new Map(
      lastMessages.map((message) => [message.conversationId, message]),
    );

    return conversations
      .map((conversation) =>
        buildSmbConversationDto({
          conversation,
          members: members.filter(
            (member) => member.conversationId === conversation.id,
          ),
          viewerWorkspaceMemberId: workspaceMemberId,
          lastMessage: lastMessageByConversationId.get(conversation.id) ?? null,
        }),
      )
      .sort(
        (first, second) =>
          (second.lastMessageAt ?? second.createdAt).getTime() -
          (first.lastMessageAt ?? first.createdAt).getTime(),
      );
  }

  async getConversation({
    workspaceId,
    workspaceMemberId,
    conversationId,
  }: ConversationViewer & {
    conversationId: string;
  }): Promise<SmbConversationDTO> {
    await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });

    return this.buildConversationDtoForViewer({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });
  }

  async openDirectConversation({
    workspaceId,
    workspaceMemberId,
    colleagueWorkspaceMemberId,
  }: ConversationViewer & {
    colleagueWorkspaceMemberId: string;
  }): Promise<SmbConversationDTO> {
    if (colleagueWorkspaceMemberId === workspaceMemberId) {
      throw new SmbConversationsException(
        'A direct conversation needs two different workspace members',
        SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT,
      );
    }

    const directKey = buildSmbDirectKey(
      workspaceMemberId,
      colleagueWorkspaceMemberId,
    );

    let conversation = await this.conversationRepository.findDirectConversation(
      workspaceId,
      directKey,
    );

    if (!isDefined(conversation)) {
      await this.accessService.assertWorkspaceMembersExist({
        workspaceId,
        workspaceMemberIds: [colleagueWorkspaceMemberId],
      });

      // null — обе стороны открыли диалог одновременно; индекс оставил один.
      conversation =
        (await this.conversationRepository.insertConversation(workspaceId, {
          kind: SmbConversationKind.DIRECT,
          name: null,
          directKey,
          createdByWorkspaceMemberId: workspaceMemberId,
        })) ??
        (await this.conversationRepository.findDirectConversation(
          workspaceId,
          directKey,
        ));
    }

    if (!isDefined(conversation)) {
      throw new SmbConversationsException(
        'The direct conversation could not be created',
        SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND,
      );
    }

    // Выполняется и для существующей беседы: чинит ту, чьё создание
    // оборвалось между строкой беседы и строками участников.
    const addedMembersCount =
      await this.conversationRepository.insertMembersIfAbsent(workspaceId, {
        conversationId: conversation.id,
        members: [
          { workspaceMemberId, role: 'MEMBER' },
          { workspaceMemberId: colleagueWorkspaceMemberId, role: 'MEMBER' },
        ],
        lastReadSeq: 0,
      });

    if (addedMembersCount > 0) {
      await this.publishConversationUpdated({
        workspaceId,
        conversationId: conversation.id,
      });
    }

    return this.buildConversationDtoForViewer({
      workspaceId,
      conversationId: conversation.id,
      workspaceMemberId,
    });
  }

  async createGroupConversation({
    workspaceId,
    workspaceMemberId,
    name,
    workspaceMemberIds,
  }: ConversationViewer & {
    name: string;
    workspaceMemberIds: string[];
  }): Promise<SmbConversationDTO> {
    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      throw new SmbConversationsException(
        'A group conversation needs a name',
        SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT,
      );
    }

    const otherWorkspaceMemberIds = [...new Set(workspaceMemberIds)].filter(
      (memberId) => memberId !== workspaceMemberId,
    );

    if (!isNonEmptyArray(otherWorkspaceMemberIds)) {
      throw new SmbConversationsException(
        'A group conversation needs at least one other member',
        SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT,
      );
    }

    await this.accessService.assertWorkspaceMembersExist({
      workspaceId,
      workspaceMemberIds: otherWorkspaceMemberIds,
    });

    const conversation = await this.conversationRepository.insertConversation(
      workspaceId,
      {
        kind: SmbConversationKind.GROUP,
        name: trimmedName,
        directKey: null,
        createdByWorkspaceMemberId: workspaceMemberId,
      },
    );

    if (!isDefined(conversation)) {
      throw new SmbConversationsException(
        'The group conversation could not be created',
        SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT,
      );
    }

    await this.conversationRepository.insertMembersIfAbsent(workspaceId, {
      conversationId: conversation.id,
      members: [
        { workspaceMemberId, role: 'OWNER' },
        ...otherWorkspaceMemberIds.map((memberId) => ({
          workspaceMemberId: memberId,
          role: 'MEMBER' as const,
        })),
      ],
      lastReadSeq: 0,
    });

    await this.publishConversationUpdated({
      workspaceId,
      conversationId: conversation.id,
    });

    return this.buildConversationDtoForViewer({
      workspaceId,
      conversationId: conversation.id,
      workspaceMemberId,
    });
  }

  async addMembers({
    workspaceId,
    workspaceMemberId,
    conversationId,
    workspaceMemberIds,
  }: ConversationViewer & {
    conversationId: string;
    workspaceMemberIds: string[];
  }): Promise<SmbConversationDTO> {
    await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });

    const conversation = await this.getConversationRowOrThrow({
      workspaceId,
      conversationId,
    });

    if (conversation.kind !== SmbConversationKind.GROUP) {
      throw new SmbConversationsException(
        'Members can only be added to a group conversation',
        SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT,
      );
    }

    const currentMembers = await this.accessService.getConversationMembers({
      workspaceId,
      conversationId,
    });
    const currentWorkspaceMemberIds = new Set(
      currentMembers.map((member) => member.workspaceMemberId),
    );
    const newWorkspaceMemberIds = [...new Set(workspaceMemberIds)].filter(
      (memberId) => !currentWorkspaceMemberIds.has(memberId),
    );

    if (
      currentMembers.length + newWorkspaceMemberIds.length >
      SMB_CONVERSATION_GROUP_MAX_MEMBERS
    ) {
      throw new SmbConversationsException(
        'The group conversation member limit is exceeded',
        SmbConversationsExceptionCode.INVALID_CONVERSATION_INPUT,
      );
    }

    if (isNonEmptyArray(newWorkspaceMemberIds)) {
      await this.accessService.assertWorkspaceMembersExist({
        workspaceId,
        workspaceMemberIds: newWorkspaceMemberIds,
      });

      // Новый участник начинает с текущей позиции: история до его прихода — не «непрочитанное».
      await this.conversationRepository.insertMembersIfAbsent(workspaceId, {
        conversationId,
        members: newWorkspaceMemberIds.map((memberId) => ({
          workspaceMemberId: memberId,
          role: 'MEMBER' as const,
        })),
        lastReadSeq: conversation.lastSeq,
      });

      await this.publishConversationUpdated({ workspaceId, conversationId });
    }

    return this.buildConversationDtoForViewer({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });
  }

  async markRead({
    workspaceId,
    workspaceMemberId,
    conversationId,
    seq,
  }: ConversationViewer & {
    conversationId: string;
    seq?: number | null;
  }): Promise<number> {
    const membership = await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });
    const conversation = await this.getConversationRowOrThrow({
      workspaceId,
      conversationId,
    });

    const targetSeq = Math.min(
      seq ?? conversation.lastSeq,
      conversation.lastSeq,
    );

    if (targetSeq <= membership.lastReadSeq) {
      return membership.lastReadSeq;
    }

    await this.conversationRepository.advanceLastReadSeq(workspaceId, {
      conversationId,
      workspaceMemberId,
      seq: targetSeq,
    });

    await this.publishToConversation({
      workspaceId,
      conversationId,
      event: {
        type: SmbConversationEventType.CONVERSATION_READ,
        conversationId,
        workspaceMemberId,
        lastReadSeq: targetSeq,
      },
    });

    return targetSeq;
  }

  async sendTyping({
    workspaceId,
    workspaceMemberId,
    conversationId,
  }: ConversationViewer & { conversationId: string }): Promise<void> {
    await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });

    await this.publishToConversation({
      workspaceId,
      conversationId,
      event: {
        type: SmbConversationEventType.TYPING,
        conversationId,
        workspaceMemberId,
      },
      exceptWorkspaceMemberId: workspaceMemberId,
    });
  }

  private async getConversationRowOrThrow({
    workspaceId,
    conversationId,
  }: {
    workspaceId: string;
    conversationId: string;
  }): Promise<SmbConversationRow> {
    const conversation = await this.conversationRepository.findConversationById(
      workspaceId,
      conversationId,
    );

    if (!isDefined(conversation)) {
      throw new SmbConversationsException(
        `Conversation ${conversationId} not found`,
        SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND,
      );
    }

    return conversation;
  }

  private async buildConversationDtoForViewer({
    workspaceId,
    conversationId,
    workspaceMemberId,
  }: ConversationViewer & {
    conversationId: string;
  }): Promise<SmbConversationDTO> {
    const [conversation, members, lastMessages] = await Promise.all([
      this.getConversationRowOrThrow({ workspaceId, conversationId }),
      this.accessService.getConversationMembers({
        workspaceId,
        conversationId,
      }),
      this.conversationRepository.findLastMessages(workspaceId, [
        conversationId,
      ]),
    ]);

    return buildSmbConversationDto({
      conversation,
      members,
      viewerWorkspaceMemberId: workspaceMemberId,
      lastMessage: lastMessages[0] ?? null,
    });
  }

  // Каждый участник получает беседу со своей точки зрения (позиция чтения, непрочитанное).
  private async publishConversationUpdated({
    workspaceId,
    conversationId,
  }: {
    workspaceId: string;
    conversationId: string;
  }): Promise<void> {
    const members = await this.accessService.getConversationMembers({
      workspaceId,
      conversationId,
    });

    await Promise.all(
      members.map(async (member) => {
        const conversation = await this.buildConversationDtoForViewer({
          workspaceId,
          conversationId,
          workspaceMemberId: member.workspaceMemberId,
        });

        await this.publishSafely(() =>
          this.eventPublisherService.publishToMember({
            workspaceId,
            workspaceMemberId: member.workspaceMemberId,
            event: {
              type: SmbConversationEventType.CONVERSATION_UPDATED,
              conversationId,
              conversation,
            },
          }),
        );
      }),
    );
  }

  private async publishToConversation({
    workspaceId,
    conversationId,
    event,
    exceptWorkspaceMemberId,
  }: {
    workspaceId: string;
    conversationId: string;
    event: SmbConversationEventDTO;
    exceptWorkspaceMemberId?: string;
  }): Promise<void> {
    const members = await this.accessService.getConversationMembers({
      workspaceId,
      conversationId,
    });

    await this.publishSafely(() =>
      this.eventPublisherService.publishToMembers({
        workspaceId,
        workspaceMemberIds: members
          .map((member) => member.workspaceMemberId)
          .filter((memberId) => memberId !== exceptWorkspaceMemberId),
        event,
      }),
    );
  }

  // Запись уже сохранена; сбой рассылки не должен превращать её в ошибку для
  // вызывающего. Клиент перечитывает данные при переподключении.
  private async publishSafely(publish: () => Promise<void>): Promise<void> {
    try {
      await publish();
    } catch (error) {
      this.logger.error('Failed to publish a conversation event', error);
    }
  }
}
