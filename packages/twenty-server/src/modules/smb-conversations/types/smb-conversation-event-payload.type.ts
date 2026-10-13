import { type SmbConversationEventDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-event.dto';

export type SmbConversationEventPayload = {
  onMessengerEvent: SmbConversationEventDTO;
};
