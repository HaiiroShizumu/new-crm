import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';
import { Avatar } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

const itemClassName = css`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing['1.5']} ${themeCssVariables.spacing[2]};
  text-align: left;
  text-decoration: none;
  width: 100%;

  &:hover,
  &[aria-current='page'] {
    background: ${themeCssVariables.background.transparent.light};
  }
`;

const StyledText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const StyledTitle = styled.span`
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPreview = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledUnread = styled.span`
  background: ${themeCssVariables.color.blue};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${themeCssVariables.font.color.inverted};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: ${themeCssVariables.spacing[4]};
  padding: 0 ${themeCssVariables.spacing[1]};
  text-align: center;
`;

type SmbConversationListItemProps = {
  title: string;
  avatarUrl: string | null | undefined;
  colorSeed: string;
  preview: string;
  unreadCount: number;
  isActive: boolean;
  // A conversation that exists is a place to go to; one that does not exist yet has to be created first.
  to?: string;
  onClick?: () => void;
};

export const SmbConversationListItem = ({
  title,
  avatarUrl,
  colorSeed,
  preview,
  unreadCount,
  isActive,
  to,
  onClick,
}: SmbConversationListItemProps) => {
  const { t } = useLingui();

  const content = (
    <>
      <Avatar
        src={getAbsoluteImageUrl(avatarUrl)}
        colorSeed={colorSeed}
        name={title}
        shape="circle"
        size="lg"
      />
      <StyledText>
        <StyledTitle>{title}</StyledTitle>
        {preview.length > 0 && <StyledPreview>{preview}</StyledPreview>}
      </StyledText>
      {unreadCount > 0 && (
        <StyledUnread aria-label={t`Непрочитанных: ${unreadCount}`}>
          {unreadCount}
        </StyledUnread>
      )}
    </>
  );

  if (isDefined(to)) {
    return (
      <Link
        className={itemClassName}
        to={to}
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={itemClassName} onClick={onClick}>
      {content}
    </button>
  );
};
