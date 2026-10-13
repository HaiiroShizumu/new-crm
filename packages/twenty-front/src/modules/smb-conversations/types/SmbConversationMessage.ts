import { type JSONContent } from '@tiptap/react';

export type SmbConversationMessage = {
  id: string;
  conversationId: string;
  seq: number;
  kind: 'TEXT' | 'VOICE' | 'FILE' | 'SYSTEM' | 'CALL';
  authorWorkspaceMemberId: string | null;
  body: JSONContent | null;
  text: string;
  clientMessageId: string;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};
