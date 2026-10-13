import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconFolder } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { type SmbDocumentFolderColor } from '@/smb-docflow/types/SmbDocumentFolderColor';
import { type SmbDocumentFolderNode } from '@/smb-docflow/types/SmbDocumentFolderNode';

const FOLDER_COLORS: Record<SmbDocumentFolderColor, string> = {
  GRAY: themeCssVariables.font.color.tertiary,
  BLUE: themeCssVariables.color.blue,
  GREEN: themeCssVariables.color.green,
  ORANGE: themeCssVariables.color.orange,
  RED: themeCssVariables.color.red,
  PURPLE: themeCssVariables.color.purple,
};

const StyledList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledFolder = styled.button<{ isSelected: boolean; depth: number }>`
  align-items: center;
  background: ${({ isSelected }) =>
    isSelected
      ? themeCssVariables.background.transparent.light
      : 'transparent'};
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  padding-left: ${({ depth }) => `${12 + depth * 16}px`};
  text-align: left;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.transparent.lighter};
  }
`;

const StyledName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

type SmbDocumentFolderTreeProps = {
  nodes: SmbDocumentFolderNode[];
  selectedFolderId: string | undefined;
  onSelect: (folderId: string | undefined) => void;
  depth?: number;
};

export const SmbDocumentFolderTree = ({
  nodes,
  selectedFolderId,
  onSelect,
  depth = 0,
}: SmbDocumentFolderTreeProps) => {
  const { t } = useLingui();

  return (
    <StyledList>
      {depth === 0 && (
        <li>
          <StyledFolder
            type="button"
            depth={0}
            isSelected={selectedFolderId === undefined}
            aria-pressed={selectedFolderId === undefined}
            onClick={() => onSelect(undefined)}
          >
            <StyledName>{t`Без папки`}</StyledName>
          </StyledFolder>
        </li>
      )}
      {nodes.map(({ folder, children }) => (
        <li key={folder.id}>
          <StyledFolder
            type="button"
            depth={depth}
            isSelected={folder.id === selectedFolderId}
            aria-pressed={folder.id === selectedFolderId}
            onClick={() => onSelect(folder.id)}
          >
            <IconFolder
              size={16}
              color={FOLDER_COLORS[folder.color ?? 'GRAY']}
            />
            <StyledName>{folder.name}</StyledName>
          </StyledFolder>
          {children.length > 0 && (
            <SmbDocumentFolderTree
              nodes={children}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </StyledList>
  );
};
