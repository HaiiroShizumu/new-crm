import { isDefined } from 'twenty-shared/utils';

import { type SmbConversationDTO } from 'src/modules/smb-conversations/dtos/smb-conversation.dto';
import { type SmbConversationEventDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-event.dto';
import { type SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';

const reviveDate = (value: Date | string): Date => new Date(value);

const reviveNullableDate = (
  value: Date | string | null | undefined,
): Date | null => (isDefined(value) ? new Date(value) : null);

const reviveMessage = (
  message: SmbConversationMessageDTO,
): SmbConversationMessageDTO => ({
  ...message,
  createdAt: reviveDate(message.createdAt),
  editedAt: reviveNullableDate(message.editedAt),
  deletedAt: reviveNullableDate(message.deletedAt),
});

const reviveConversation = (
  conversation: SmbConversationDTO,
): SmbConversationDTO => ({
  ...conversation,
  createdAt: reviveDate(conversation.createdAt),
  lastMessageAt: reviveNullableDate(conversation.lastMessageAt),
  mutedUntil: reviveNullableDate(conversation.mutedUntil),
  lastMessage: isDefined(conversation.lastMessage)
    ? reviveMessage(conversation.lastMessage)
    : null,
});

// Events cross Redis as JSON, which turns dates into strings the GraphQL date scalar refuses to serialize.
export const reviveSmbConversationEventDates = (
  event: SmbConversationEventDTO,
): SmbConversationEventDTO => ({
  ...event,
  message: isDefined(event.message) ? reviveMessage(event.message) : null,
  conversation: isDefined(event.conversation)
    ? reviveConversation(event.conversation)
    : null,
});
