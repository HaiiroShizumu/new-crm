import { type JSONContent } from '@tiptap/react';

// A message the user sent that the server has not confirmed yet. It has no seq,
// so it lives beside the confirmed history instead of inside it.
export type SmbConversationPendingMessage = {
  clientMessageId: string;
  body: JSONContent;
  text: string;
  createdAt: string;
  status: 'sending' | 'failed';
};
