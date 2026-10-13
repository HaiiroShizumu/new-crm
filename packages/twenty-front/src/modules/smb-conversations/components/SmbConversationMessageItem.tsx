import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Avatar } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

import { type SmbConversationMessage } from '@/smb-conversations/types/SmbConversationMessage';
import { SMB_CONVERSATION_SYSTEM_MESSAGE_CODES } from '@/smb-conversations/constants/SmbConversationSystemMessageCodes';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

const StyledRow = styled.div<{ isPending: boolean }>`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  opacity: ${({ isPending }) => (isPending ? 0.6 : 1)};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[4]};
`;

const StyledContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const StyledMeta = styled.div`
  align-items: baseline;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledAuthor = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledTime = styled.time`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.xs};
`;

const StyledText = styled.div<{ isMuted: boolean }>`
  color: ${({ isMuted }) =>
    isMuted
      ? themeCssVariables.font.color.tertiary
      : themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-style: ${({ isMuted }) => (isMuted ? 'italic' : 'normal')};
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const StyledSystemRow = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[4]};
  text-align: center;
`;

const StyledFailed = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.danger};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledRetry = styled.button`
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.danger};
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  text-decoration: underline;
`;

type SmbConversationMessageItemProps = {
  kind: SmbConversationMessage['kind'];
  authorName: string;
  authorAvatarUrl: string | null | undefined;
  authorColorSeed: string;
  text: string;
  createdAt: string;
  isDeleted: boolean;
  isEdited: boolean;
  deliveryStatus: 'sent' | 'sending' | 'failed';
  onRetry?: () => void;
};

export const SmbConversationMessageItem = ({
  kind,
  authorName,
  authorAvatarUrl,
  authorColorSeed,
  text,
  createdAt,
  isDeleted,
  isEdited,
  deliveryStatus,
  onRetry,
}: SmbConversationMessageItemProps) => {
  const { t } = useLingui();

  if (kind === 'SYSTEM') {
    const systemTextByCode: Record<string, string> = {
      [SMB_CONVERSATION_SYSTEM_MESSAGE_CODES.CALL_STARTED]: t`Звонок начат`,
      [SMB_CONVERSATION_SYSTEM_MESSAGE_CODES.CALL_ENDED]: t`Звонок завершён`,
    };

    return <StyledSystemRow>{systemTextByCode[text] ?? text}</StyledSystemRow>;
  }

  const time = new Date(createdAt);

  return (
    <StyledRow isPending={deliveryStatus === 'sending'}>
      <Avatar
        src={getAbsoluteImageUrl(authorAvatarUrl)}
        colorSeed={authorColorSeed}
        name={authorName}
        shape="circle"
        size="lg"
      />
      <StyledContent>
        <StyledMeta>
          <StyledAuthor>{authorName}</StyledAuthor>
          <StyledTime dateTime={createdAt}>
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </StyledTime>
          {isEdited && !isDeleted && (
            <StyledTime as="span">{t`изменено`}</StyledTime>
          )}
        </StyledMeta>
        <StyledText isMuted={isDeleted}>
          {isDeleted ? t`Сообщение удалено` : text}
        </StyledText>
        {deliveryStatus === 'failed' && (
          <StyledFailed role="alert">
            {t`Не отправлено.`}
            <StyledRetry type="button" onClick={onRetry}>
              {t`Повторить`}
            </StyledRetry>
          </StyledFailed>
        )}
      </StyledContent>
    </StyledRow>
  );
};
