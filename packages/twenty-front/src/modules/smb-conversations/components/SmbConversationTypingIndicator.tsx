import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { isNonEmptyArray } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { SMB_CONVERSATION_TYPING_INDICATOR_DURATION_MS } from '@/smb-conversations/constants/SmbConversationTypingIndicatorDurationMs';
import { smbConversationTypingFamilyState } from '@/smb-conversations/states/smbConversationTypingFamilyState';
import { getSmbWorkspaceMemberName } from '@/smb-conversations/utils/getSmbWorkspaceMemberName';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

const StyledIndicator = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  height: ${themeCssVariables.spacing[5]};
  padding: 0 ${themeCssVariables.spacing[4]};
`;

type SmbConversationTypingIndicatorProps = {
  conversationId: string;
};

export const SmbConversationTypingIndicator = ({
  conversationId,
}: SmbConversationTypingIndicatorProps) => {
  const { t } = useLingui();
  const smbConversationTyping = useAtomFamilyStateValue(
    smbConversationTypingFamilyState,
    conversationId,
  );
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const [now, setNow] = useState(() => Date.now());

  const hasTypingSignals = Object.keys(smbConversationTyping).length > 0;

  // Nothing tells us a person stopped typing; the signal simply ages out, and
  // only a clock tick can make that visible.
  useEffect(() => {
    if (!hasTypingSignals) {
      return;
    }

    const interval = setInterval(() => setNow(Date.now()), 1_000);

    return () => clearInterval(interval);
  }, [hasTypingSignals]);

  const typingNames = Object.entries(smbConversationTyping)
    .filter(
      ([, lastSignalAt]) =>
        now - lastSignalAt < SMB_CONVERSATION_TYPING_INDICATOR_DURATION_MS,
    )
    .map(([workspaceMemberId]) =>
      getSmbWorkspaceMemberName(
        currentWorkspaceMembers.find(({ id }) => id === workspaceMemberId),
      ),
    );

  const names = typingNames.join(', ');

  return (
    <StyledIndicator aria-live="polite">
      {isNonEmptyArray(typingNames) && t`${names} печатает…`}
    </StyledIndicator>
  );
};
