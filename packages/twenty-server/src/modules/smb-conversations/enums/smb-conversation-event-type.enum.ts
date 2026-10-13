import { registerEnumType } from '@nestjs/graphql';

export enum SmbConversationEventType {
  KEEPALIVE = 'KEEPALIVE',
  MESSAGE_CREATED = 'MESSAGE_CREATED',
  MESSAGE_UPDATED = 'MESSAGE_UPDATED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  CONVERSATION_UPDATED = 'CONVERSATION_UPDATED',
  CONVERSATION_READ = 'CONVERSATION_READ',
  TYPING = 'TYPING',
}

registerEnumType(SmbConversationEventType, {
  name: 'SmbConversationEventType',
});
