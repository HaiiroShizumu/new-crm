import { type RecordGroupDefinition } from '@/object-record/record-group/types/RecordGroupDefinition';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';
import { IconCircleDot } from 'twenty-ui/icon';
import {
  type ThemeColor,
  themeCssVariables,
  useTheme,
  type ThemeType as Theme,
} from 'twenty-ui/theme';

type SmbRecordBoardColumnTitleProps = {
  recordGroupDefinition: RecordGroupDefinition;
  recordCount: number;
};

type SmbRecordBoardColumnHeaderCardProps = {
  color: ThemeColor | 'transparent';
  children: ReactNode;
};

const StyledCard = styled.div`
  background: var(--smb-board-column-header-bg, ${themeCssVariables.background.tertiary});
  border-radius: var(--radius-lg, ${themeCssVariables.border.radius.md});
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 100%;
  min-width: 0;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  width: 100%;
`;

const StyledTopRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[1.5]};
  max-width: 100%;
  min-width: 0;
`;

const StyledIcon = styled.span`
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
  font-variant-numeric: tabular-nums;
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-left: auto;
`;

const getStageIconColor = ({
  color,
  theme,
}: {
  color: ThemeColor | 'transparent';
  theme: Theme;
}): string => {
  if (color === 'transparent') {
    return theme.font.color.tertiary;
  }

  return theme.tag.text[color] ?? theme.font.color.tertiary;
};

const getStageBackgroundColor = ({
  color,
  theme,
}: {
  color: ThemeColor | 'transparent';
  theme: Theme;
}): string => {
  if (color === 'transparent') {
    return theme.background.tertiary;
  }

  return theme.tag.background[color] ?? theme.background.tertiary;
};

export const SmbRecordBoardColumnHeaderCard = ({
  color,
  children,
}: SmbRecordBoardColumnHeaderCardProps) => {
  const theme = useTheme();

  return (
    <StyledCard
      data-smb-board-column-header-card
      style={{
        ['--smb-board-column-header-bg' as string]: getStageBackgroundColor({
          color,
          theme,
        }),
      }}
    >
      {children}
    </StyledCard>
  );
};

export const SmbRecordBoardColumnTitle = ({
  recordGroupDefinition,
  recordCount,
}: SmbRecordBoardColumnTitleProps) => {
  const theme = useTheme();
  const iconColor = getStageIconColor({
    color: recordGroupDefinition.color,
    theme,
  });

  return (
    <StyledTopRow data-smb-board-column-title>
      <StyledIcon aria-hidden>
        <IconCircleDot size={theme.icon.size.sm} color={iconColor} />
      </StyledIcon>
      <StyledName>{recordGroupDefinition.title}</StyledName>
      <StyledCount>{recordCount}</StyledCount>
    </StyledTopRow>
  );
};
