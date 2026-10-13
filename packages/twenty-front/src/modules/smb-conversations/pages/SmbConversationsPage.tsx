import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbConversationList } from '@/smb-conversations/components/SmbConversationList';
import { SmbConversationView } from '@/smb-conversations/components/SmbConversationView';
import { SmbConversationsRuntimeEffect } from '@/smb-conversations/components/SmbConversationsRuntimeEffect';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';

const StyledLayout = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const StyledEmptyState = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  font-size: ${themeCssVariables.font.size.md};
  justify-content: center;
`;

export const SmbConversationsPage = () => {
  const { t } = useLingui();
  const { conversationId } = useParams();

  return (
    <PageCardLayout header={<PageCardHeader title={t`Чаты`} />}>
      <SmbConversationsRuntimeEffect />
      <StyledLayout>
        <SmbConversationList activeConversationId={conversationId} />
        {isDefined(conversationId) ? (
          // Keyed by conversation so the editor and the scroll position start fresh for each conversation.
          <SmbConversationView
            key={conversationId}
            conversationId={conversationId}
          />
        ) : (
          <StyledEmptyState>{t`Выберите чат или сотрудника`}</StyledEmptyState>
        )}
      </StyledLayout>
    </PageCardLayout>
  );
};
