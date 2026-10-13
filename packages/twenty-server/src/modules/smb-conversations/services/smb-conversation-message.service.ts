import { Injectable, Logger } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { isUniqueViolationError } from 'src/engine/metadata-modules/ai/ai-chat/utils/is-unique-violation-error.util';
import { SMB_CONVERSATION_MESSAGES_DEFAULT_PAGE_SIZE } from 'src/modules/smb-conversations/constants/smb-conversation-messages-default-page-size.constant';
import { SMB_CONVERSATION_MESSAGES_MAX_PAGE_SIZE } from 'src/modules/smb-conversations/constants/smb-conversation-messages-max-page-size.constant';
import { type SmbConversationEventDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-event.dto';
import { type SmbConversationMessagePageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message-page.dto';
import { type SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';
import { SmbConversationEventType } from 'src/modules/smb-conversations/enums/smb-conversation-event-type.enum';
import { SmbConversationMessageKind } from 'src/modules/smb-conversations/enums/smb-conversation-message-kind.enum';
import { SmbConversationRepository } from 'src/modules/smb-conversations/repositories/smb-conversation.repository';
import { SmbConversationAccessService } from 'src/modules/smb-conversations/services/smb-conversation-access.service';
import { SmbConversationEventPublisherService } from 'src/modules/smb-conversations/services/smb-conversation-event-publisher.service';
import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';
import { type SmbConversationMessageBody } from 'src/modules/smb-conversations/types/smb-conversation-message-body.type';
import { type SmbConversationMessageRow } from 'src/modules/smb-conversations/types/smb-conversation-message-row.type';
import { fromSmbConversationMessageRowToDto } from 'src/modules/smb-conversations/utils/from-smb-conversation-message-row-to-dto.util';
import { parseSmbConversationMessageBody } from 'src/modules/smb-conversations/utils/parse-smb-conversation-message-body.util';

type MessageActor = { workspaceId: string; workspaceMemberId: string };

type SentSmbConversationMessage = {
  message: SmbConversationMessageDTO;
  isNew: boolean;
  mentionedWorkspaceMemberIds: string[];
};

@Injectable()
export class SmbConversationMessageService {
  private readonly logger = new Logger(SmbConversationMessageService.name);

  constructor(
    private readonly conversationRepository: SmbConversationRepository,
    private readonly accessService: SmbConversationAccessService,
    private readonly eventPublisherService: SmbConversationEventPublisherService,
  ) {}

  async getMessages({
    workspaceId,
    workspaceMemberId,
    conversationId,
    beforeSeq,
    afterSeq,
    limit,
  }: MessageActor & {
    conversationId: string;
    beforeSeq?: number | null;
    afterSeq?: number | null;
    limit?: number | null;
  }): Promise<SmbConversationMessagePageDTO> {
    await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });

    const pageSize = Math.min(
      Math.max(limit ?? SMB_CONVERSATION_MESSAGES_DEFAULT_PAGE_SIZE, 1),
      SMB_CONVERSATION_MESSAGES_MAX_PAGE_SIZE,
    );
    const isCatchUp = isDefined(afterSeq);

    const rows = await this.conversationRepository.findMessages(workspaceId, {
      conversationId,
      beforeSeq: beforeSeq ?? null,
      afterSeq: afterSeq ?? null,
      limit: pageSize + 1,
    });

    const page = rows.slice(0, pageSize);

    return {
      messages: (isCatchUp ? page : page.reverse()).map(
        fromSmbConversationMessageRowToDto,
      ),
      hasMore: rows.length > pageSize,
    };
  }

  async sendMessage({
    workspaceId,
    workspaceMemberId,
    conversationId,
    clientMessageId,
    body,
  }: MessageActor & {
    conversationId: string;
    clientMessageId: string;
    body: unknown;
  }): Promise<SentSmbConversationMessage> {
    await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId,
      workspaceMemberId,
    });

    const alreadySentMessage =
      await this.conversationRepository.findMessageByClientMessageId(
        workspaceId,
        conversationId,
        clientMessageId,
      );

    if (isDefined(alreadySentMessage)) {
      return {
        message: fromSmbConversationMessageRowToDto(alreadySentMessage),
        isNew: false,
        mentionedWorkspaceMemberIds: [],
      };
    }

    const parsedBody = parseSmbConversationMessageBody(body);

    const message = await this.insertMessage({
      workspaceId,
      conversationId,
      clientMessageId,
      kind: SmbConversationMessageKind.TEXT,
      authorWorkspaceMemberId: workspaceMemberId,
      body: parsedBody.body,
      text: parsedBody.text,
    });

    // Автор прочитал собственное сообщение.
    await this.conversationRepository.advanceLastReadSeq(workspaceId, {
      conversationId,
      workspaceMemberId,
      seq: message.seq,
    });

    const messageDto = fromSmbConversationMessageRowToDto(message);

    await this.publishToConversation({
      workspaceId,
      conversationId,
      event: {
        type: SmbConversationEventType.MESSAGE_CREATED,
        conversationId,
        workspaceMemberId,
        message: messageDto,
      },
    });

    return {
      message: messageDto,
      isNew: true,
      mentionedWorkspaceMemberIds: parsedBody.mentionedWorkspaceMemberIds,
    };
  }

  // Системное сообщение хранит код, а не фразу: каждый читатель видит его на своём языке.
  async createSystemMessage({
    workspaceId,
    conversationId,
    code,
  }: {
    workspaceId: string;
    conversationId: string;
    code: string;
  }): Promise<SmbConversationMessageDTO> {
    const message = await this.insertMessage({
      workspaceId,
      conversationId,
      clientMessageId: v4(),
      kind: SmbConversationMessageKind.SYSTEM,
      authorWorkspaceMemberId: null,
      body: null,
      text: code,
    });

    const messageDto = fromSmbConversationMessageRowToDto(message);

    await this.publishToConversation({
      workspaceId,
      conversationId,
      event: {
        type: SmbConversationEventType.MESSAGE_CREATED,
        conversationId,
        message: messageDto,
      },
    });

    return messageDto;
  }

  async editMessage({
    workspaceId,
    workspaceMemberId,
    messageId,
    body,
  }: MessageActor & {
    messageId: string;
    body: unknown;
  }): Promise<SmbConversationMessageDTO> {
    await this.getOwnMessageOrThrow({
      workspaceId,
      workspaceMemberId,
      messageId,
    });

    const parsedBody = parseSmbConversationMessageBody(body);

    const editedMessage =
      await this.conversationRepository.updateMessageContent(workspaceId, {
        messageId,
        body: parsedBody.body,
        text: parsedBody.text,
      });

    return this.publishChangedMessage({
      workspaceId,
      workspaceMemberId,
      message: editedMessage,
      messageId,
      type: SmbConversationEventType.MESSAGE_UPDATED,
    });
  }

  async deleteMessage({
    workspaceId,
    workspaceMemberId,
    messageId,
  }: MessageActor & { messageId: string }): Promise<SmbConversationMessageDTO> {
    await this.getOwnMessageOrThrow({
      workspaceId,
      workspaceMemberId,
      messageId,
    });

    const deletedMessage =
      await this.conversationRepository.clearMessageContent(
        workspaceId,
        messageId,
      );

    return this.publishChangedMessage({
      workspaceId,
      workspaceMemberId,
      message: deletedMessage,
      messageId,
      type: SmbConversationEventType.MESSAGE_DELETED,
    });
  }

  private async publishChangedMessage({
    workspaceId,
    workspaceMemberId,
    message,
    messageId,
    type,
  }: MessageActor & {
    message: SmbConversationMessageRow | null;
    messageId: string;
    type: SmbConversationEventType;
  }): Promise<SmbConversationMessageDTO> {
    // null — сообщение удалили между проверкой и изменением.
    if (!isDefined(message)) {
      throw new SmbConversationsException(
        `Message ${messageId} not found`,
        SmbConversationsExceptionCode.MESSAGE_NOT_FOUND,
      );
    }

    const messageDto = fromSmbConversationMessageRowToDto(message);

    await this.publishToConversation({
      workspaceId,
      conversationId: message.conversationId,
      event: {
        type,
        conversationId: message.conversationId,
        workspaceMemberId,
        message: messageDto,
      },
    });

    return messageDto;
  }

  private async getOwnMessageOrThrow({
    workspaceId,
    workspaceMemberId,
    messageId,
  }: MessageActor & { messageId: string }): Promise<SmbConversationMessageRow> {
    const message = await this.conversationRepository.findMessageById(
      workspaceId,
      messageId,
    );

    if (!isDefined(message) || isDefined(message.deletedAt)) {
      throw new SmbConversationsException(
        `Message ${messageId} not found`,
        SmbConversationsExceptionCode.MESSAGE_NOT_FOUND,
      );
    }

    // Сначала членство: исключённый из беседы не должен узнать, что сообщение существует.
    await this.accessService.getMembershipOrThrow({
      workspaceId,
      conversationId: message.conversationId,
      workspaceMemberId,
    });

    if (message.authorWorkspaceMemberId !== workspaceMemberId) {
      throw new SmbConversationsException(
        `Workspace member ${workspaceMemberId} is not the author of message ${messageId}`,
        SmbConversationsExceptionCode.NOT_MESSAGE_AUTHOR,
      );
    }

    return message;
  }

  private async insertMessage({
    workspaceId,
    conversationId,
    clientMessageId,
    kind,
    authorWorkspaceMemberId,
    body,
    text,
  }: {
    workspaceId: string;
    conversationId: string;
    clientMessageId: string;
    kind: SmbConversationMessageKind;
    authorWorkspaceMemberId: string | null;
    body: SmbConversationMessageBody | null;
    text: string;
  }): Promise<SmbConversationMessageRow> {
    try {
      const message =
        await this.conversationRepository.insertMessageWithNextSeq(
          workspaceId,
          {
            conversationId,
            kind,
            authorWorkspaceMemberId,
            body,
            text,
            clientMessageId,
          },
        );

      if (!isDefined(message)) {
        throw new SmbConversationsException(
          `Conversation ${conversationId} not found`,
          SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND,
        );
      }

      return message;
    } catch (error) {
      // Два повтора одной отправки проскочили проверку одновременно; индекс оставил первый.
      if (!isUniqueViolationError(error)) {
        throw error;
      }

      const concurrentMessage =
        await this.conversationRepository.findMessageByClientMessageId(
          workspaceId,
          conversationId,
          clientMessageId,
        );

      if (!isDefined(concurrentMessage)) {
        throw error;
      }

      return concurrentMessage;
    }
  }

  private async publishToConversation({
    workspaceId,
    conversationId,
    event,
  }: {
    workspaceId: string;
    conversationId: string;
    event: SmbConversationEventDTO;
  }): Promise<void> {
    // Сообщение уже сохранено; сбой рассылки не должен ронять отправку.
    // Клиент дочитывает пропущенное по seq при переподключении.
    try {
      const members = await this.accessService.getConversationMembers({
        workspaceId,
        conversationId,
      });

      await this.eventPublisherService.publishToMembers({
        workspaceId,
        workspaceMemberIds: members.map((member) => member.workspaceMemberId),
        event,
      });
    } catch (error) {
      this.logger.error('Failed to publish a conversation event', error);
    }
  }
}
