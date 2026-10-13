type SmbConversationMessageBodyAttributes = Record<
  string,
  string | number | boolean | null
>;

export type SmbConversationMessageBodyNode = {
  type: string;
  text?: string;
  attrs?: SmbConversationMessageBodyAttributes;
  marks?: { type: string; attrs?: SmbConversationMessageBodyAttributes }[];
  content?: SmbConversationMessageBodyNode[];
};

export type SmbConversationMessageBody = SmbConversationMessageBodyNode & {
  type: 'doc';
};
