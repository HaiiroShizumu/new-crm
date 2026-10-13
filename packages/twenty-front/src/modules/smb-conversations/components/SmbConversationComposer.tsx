import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { useStore } from 'jotai';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconSend } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useSendSmbConversationMessage } from '@/smb-conversations/hooks/useSendSmbConversationMessage';
import { useSendSmbConversationTyping } from '@/smb-conversations/hooks/useSendSmbConversationTyping';
import { getSmbConversationEditorExtensions } from '@/smb-conversations/utils/getSmbConversationEditorExtensions';
import { getSmbWorkspaceMemberName } from '@/smb-conversations/utils/getSmbWorkspaceMemberName';

const StyledComposer = styled.div`
  align-items: flex-end;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledEditor = styled.div`
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  max-height: 180px;
  min-width: 0;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &:focus-within {
    border-color: ${themeCssVariables.color.blue};
  }

  .tiptap {
    color: ${themeCssVariables.font.color.primary};
    line-height: 1.5;
    outline: none;
  }

  .tiptap p {
    margin: 0;
  }

  .tiptap p.is-editor-empty:first-of-type::before {
    color: ${themeCssVariables.font.color.light};
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

const StyledSend = styled.button`
  align-items: center;
  background: ${themeCssVariables.color.blue};
  border: none;
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.inverted};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  height: ${themeCssVariables.spacing[8]};
  justify-content: center;
  width: ${themeCssVariables.spacing[8]};
`;

type SmbConversationComposerProps = {
  conversationId: string;
};

export const SmbConversationComposer = ({
  conversationId,
}: SmbConversationComposerProps) => {
  const { t } = useLingui();
  const theme = useTheme();
  const store = useStore();
  const { sendSmbConversationMessage } =
    useSendSmbConversationMessage(conversationId);
  const { sendSmbConversationTyping } =
    useSendSmbConversationTyping(conversationId);

  const submit = (editor: Editor) => {
    const text = editor.getText({ blockSeparator: '\n' }).trim();

    if (text.length === 0) {
      return;
    }

    sendSmbConversationMessage({ body: editor.getJSON(), text });
    editor.commands.clearContent();
    editor.commands.focus();
  };

  // Tiptap keeps the callbacks from the first render. They stay valid: the
  // conversation is remounted per conversation, and the colleague list is read from
  // the store at search time instead of being captured.
  const searchMentionRecords = async (query: string) => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const currentWorkspaceMemberId = store.get(
      currentWorkspaceMemberState.atom,
    )?.id;

    return store
      .get(currentWorkspaceMembersState.atom)
      .filter(({ id }) => id !== currentWorkspaceMemberId)
      .map((workspaceMember) => ({
        recordId: workspaceMember.id,
        objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
        objectLabelSingular: '',
        label: getSmbWorkspaceMemberName(workspaceMember),
        imageUrl: workspaceMember.avatarUrl ?? '',
      }))
      .filter(({ label }) =>
        label.toLocaleLowerCase().includes(normalizedQuery),
      );
  };

  const editor = useEditor({
    extensions: getSmbConversationEditorExtensions({
      placeholder: t`Напишите сообщение`,
      onSubmit: submit,
      searchMentionRecords,
    }),
    editorProps: {
      attributes: { role: 'textbox', 'aria-label': t`Сообщение` },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      if (!updatedEditor.isEmpty) {
        sendSmbConversationTyping();
      }
    },
  });

  return (
    <StyledComposer>
      <StyledEditor>
        <EditorContent editor={editor} />
      </StyledEditor>
      <StyledSend
        type="button"
        aria-label={t`Отправить`}
        onClick={() => {
          if (isDefined(editor)) {
            submit(editor);
          }
        }}
      >
        <IconSend size={theme.icon.size.md} />
      </StyledSend>
    </StyledComposer>
  );
};
