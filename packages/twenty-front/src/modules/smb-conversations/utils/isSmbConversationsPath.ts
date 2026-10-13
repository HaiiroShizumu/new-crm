import { SMB_CONVERSATIONS_PATH } from '@/smb-conversations/constants/SmbConversationsPath';

export const isSmbConversationsPath = (pathname: string) =>
  pathname === SMB_CONVERSATIONS_PATH ||
  pathname.startsWith(`${SMB_CONVERSATIONS_PATH}/`);
