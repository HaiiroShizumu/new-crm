import { QueryFailedError } from 'typeorm';

import { SmbConversationEventType } from 'src/modules/smb-conversations/enums/smb-conversation-event-type.enum';
import { SmbConversationMessageKind } from 'src/modules/smb-conversations/enums/smb-conversation-message-kind.enum';
import { type SmbConversationRepository } from 'src/modules/smb-conversations/repositories/smb-conversation.repository';
import { type SmbConversationAccessService } from 'src/modules/smb-conversations/services/smb-conversation-access.service';
import { type SmbConversationEventPublisherService } from 'src/modules/smb-conversations/services/smb-conversation-event-publisher.service';
import { SmbConversationMessageService } from 'src/modules/smb-conversations/services/smb-conversation-message.service';
import {
  SmbConversationsException,
  SmbConversationsExceptionCode,
} from 'src/modules/smb-conversations/smb-conversations.exception';
import { type SmbConversationMessageRow } from 'src/modules/smb-conversations/types/smb-conversation-message-row.type';

const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';
const AUTHOR_ID = '20202020-0687-4c41-b707-ed1bfca972a7';
const COLLEAGUE_ID = '20202020-77d5-4cb6-b60a-f4a835a85d61';
const CONVERSATION_ID = '20202020-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CLIENT_MESSAGE_ID = '20202020-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const BODY = {
  type: 'doc' as const,
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
};

const storedMessage = (
  overrides: Partial<SmbConversationMessageRow> = {},
): SmbConversationMessageRow => ({
  id: 'message-id',
  workspaceId: WORKSPACE_ID,
  conversationId: CONVERSATION_ID,
  seq: 7,
  kind: SmbConversationMessageKind.TEXT,
  authorWorkspaceMemberId: AUTHOR_ID,
  body: BODY,
  text: 'Hello',
  clientMessageId: CLIENT_MESSAGE_ID,
  replyToMessageId: null,
  createdAt: new Date('2026-10-12T10:00:00Z'),
  editedAt: null,
  deletedAt: null,
  ...overrides,
});

const buildService = () => {
  const conversationRepository = {
    findMessageByClientMessageId: jest.fn().mockResolvedValue(null),
    findMessageById: jest.fn().mockResolvedValue(null),
    insertMessageWithNextSeq: jest.fn().mockResolvedValue(storedMessage()),
    advanceLastReadSeq: jest.fn().mockResolvedValue(undefined),
    updateMessageContent: jest.fn().mockResolvedValue(null),
    clearMessageContent: jest.fn().mockResolvedValue(null),
  };
  const accessService = {
    getMembershipOrThrow: jest.fn().mockResolvedValue({}),
    getConversationMembers: jest
      .fn()
      .mockResolvedValue([
        { workspaceMemberId: AUTHOR_ID },
        { workspaceMemberId: COLLEAGUE_ID },
      ]),
  };
  const eventPublisherService = {
    publishToMembers: jest.fn().mockResolvedValue(undefined),
  };

  const service = new SmbConversationMessageService(
    conversationRepository as unknown as SmbConversationRepository,
    accessService as unknown as SmbConversationAccessService,
    eventPublisherService as unknown as SmbConversationEventPublisherService,
  );

  return {
    service,
    conversationRepository,
    accessService,
    eventPublisherService,
  };
};

const sendInput = {
  workspaceId: WORKSPACE_ID,
  workspaceMemberId: AUTHOR_ID,
  conversationId: CONVERSATION_ID,
  clientMessageId: CLIENT_MESSAGE_ID,
  body: BODY,
};

describe('SmbConversationMessageService', () => {
  describe('sendMessage', () => {
    it('stores the message and delivers it to every member', async () => {
      const { service, conversationRepository, eventPublisherService } =
        buildService();

      const result = await service.sendMessage(sendInput);

      expect(result.isNew).toBe(true);
      expect(
        conversationRepository.insertMessageWithNextSeq,
      ).toHaveBeenCalledWith(
        WORKSPACE_ID,
        expect.objectContaining({
          conversationId: CONVERSATION_ID,
          text: 'Hello',
        }),
      );
      expect(eventPublisherService.publishToMembers).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: WORKSPACE_ID,
          workspaceMemberIds: [AUTHOR_ID, COLLEAGUE_ID],
          event: expect.objectContaining({
            type: SmbConversationEventType.MESSAGE_CREATED,
          }),
        }),
      );
    });

    it('returns the stored message instead of creating a duplicate when a send is retried', async () => {
      const { service, conversationRepository, eventPublisherService } =
        buildService();

      conversationRepository.findMessageByClientMessageId.mockResolvedValue(
        storedMessage(),
      );

      const result = await service.sendMessage(sendInput);

      expect(result.isNew).toBe(false);
      expect(result.message.id).toBe('message-id');
      expect(
        conversationRepository.insertMessageWithNextSeq,
      ).not.toHaveBeenCalled();
      expect(eventPublisherService.publishToMembers).not.toHaveBeenCalled();
    });

    it('returns the winner when two retries race past the lookup', async () => {
      const { service, conversationRepository } = buildService();
      const uniqueViolation = Object.assign(
        new QueryFailedError('insert', [], new Error('duplicate key')),
        { code: '23505' },
      );

      conversationRepository.insertMessageWithNextSeq.mockRejectedValue(
        uniqueViolation,
      );
      conversationRepository.findMessageByClientMessageId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(storedMessage());

      const result = await service.sendMessage(sendInput);

      expect(result.message.id).toBe('message-id');
    });

    it('refuses a sender who is not a member and stores nothing', async () => {
      const { service, conversationRepository, accessService } = buildService();

      accessService.getMembershipOrThrow.mockRejectedValue(
        new SmbConversationsException(
          'not a member',
          SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND,
        ),
      );

      await expect(service.sendMessage(sendInput)).rejects.toMatchObject({
        code: SmbConversationsExceptionCode.CONVERSATION_NOT_FOUND,
      });
      expect(
        conversationRepository.insertMessageWithNextSeq,
      ).not.toHaveBeenCalled();
    });

    it('moves the author read position to their own message', async () => {
      const { service, conversationRepository } = buildService();

      await service.sendMessage(sendInput);

      expect(conversationRepository.advanceLastReadSeq).toHaveBeenCalledWith(
        WORKSPACE_ID,
        {
          conversationId: CONVERSATION_ID,
          workspaceMemberId: AUTHOR_ID,
          seq: 7,
        },
      );
    });

    it('still succeeds when the realtime fan-out fails', async () => {
      const { service, eventPublisherService } = buildService();

      eventPublisherService.publishToMembers.mockRejectedValue(
        new Error('redis down'),
      );

      await expect(service.sendMessage(sendInput)).resolves.toMatchObject({
        isNew: true,
      });
    });
  });

  describe('editMessage', () => {
    it('refuses a member who is not the author', async () => {
      const { service, conversationRepository } = buildService();

      conversationRepository.findMessageById.mockResolvedValue(storedMessage());

      await expect(
        service.editMessage({
          workspaceId: WORKSPACE_ID,
          workspaceMemberId: COLLEAGUE_ID,
          messageId: 'message-id',
          body: BODY,
        }),
      ).rejects.toMatchObject({
        code: SmbConversationsExceptionCode.NOT_MESSAGE_AUTHOR,
      });
      expect(
        conversationRepository.updateMessageContent,
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    it('treats an already deleted message as missing', async () => {
      const { service, conversationRepository } = buildService();

      conversationRepository.findMessageById.mockResolvedValue(
        storedMessage({ deletedAt: new Date() }),
      );

      await expect(
        service.deleteMessage({
          workspaceId: WORKSPACE_ID,
          workspaceMemberId: AUTHOR_ID,
          messageId: 'message-id',
        }),
      ).rejects.toMatchObject({
        code: SmbConversationsExceptionCode.MESSAGE_NOT_FOUND,
      });
    });
  });
});
