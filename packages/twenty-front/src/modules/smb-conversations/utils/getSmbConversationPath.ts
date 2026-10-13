import { SMB_CONVERSATIONS_PATH } from '@/smb-conversations/constants/SmbConversationsPath';

export const getSmbConversationPath = (conversationId: string) =>
  `${SMB_CONVERSATIONS_PATH}/${conversationId}`;
