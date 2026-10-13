import { type Editor, Extension } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Placeholder } from '@tiptap/extensions/placeholder';
import { UndoRedo } from '@tiptap/extensions/undo-redo';

import { MentionSuggestion } from '@/mention/extensions/MentionSuggestion';
import { MentionTag } from '@/mention/extensions/MentionTag';
import { type MentionSearchResult } from '@/mention/types/MentionSearchResult';

// Enter means three things here, in this order: pick a colleague while the
// mention menu is open, otherwise send, and never the editor default of
// starting a new paragraph (default priority is 100).
const MENTION_SUGGESTION_PRIORITY = 200;
const SUBMIT_SHORTCUT_PRIORITY = 150;

export const getSmbConversationEditorExtensions = ({
  placeholder,
  onSubmit,
  searchMentionRecords,
}: {
  placeholder: string;
  onSubmit: (editor: Editor) => void;
  searchMentionRecords: (query: string) => Promise<MentionSearchResult[]>;
}) => [
  Document,
  Paragraph,
  Text,
  HardBreak,
  UndoRedo,
  Placeholder.configure({ placeholder }),
  MentionTag,
  MentionSuggestion.extend({ priority: MENTION_SUGGESTION_PRIORITY }).configure(
    {
      searchMentionRecords,
    },
  ),
  Extension.create({
    name: 'smbConversationSubmitShortcut',
    priority: SUBMIT_SHORTCUT_PRIORITY,
    addKeyboardShortcuts: () => ({
      Enter: ({ editor }) => {
        onSubmit(editor);

        return true;
      },
    }),
  }),
];
