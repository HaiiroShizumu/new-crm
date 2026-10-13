import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbDocflowPreviewTitle } from '@/smb-docflow/components/SmbDocflowPreviewTitle';
import { SMB_DOCUMENT_EDITORS } from '@/smb-docflow/constants/SmbDocumentEditors';
import { type SmbDocument } from '@/smb-docflow/types/SmbDocument';
import { formatDate } from '~/utils/date-utils';

const StyledDetails = styled.dl`
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
  grid-template-columns: max-content 1fr;
  margin: 0;
`;

const StyledTerm = styled.dt`
  color: ${themeCssVariables.font.color.tertiary};
`;

const StyledValue = styled.dd`
  color: ${themeCssVariables.font.color.primary};
  margin: 0;
`;

type SmbDocumentPreviewProps = {
  document: SmbDocument;
};

export const SmbDocumentPreview = ({ document }: SmbDocumentPreviewProps) => {
  const { t } = useLingui();
  const Editor = SMB_DOCUMENT_EDITORS[document.editorKind ?? 'NONE'];

  const statusLabels: Record<string, string> = {
    DRAFT: t`Черновик`,
    IN_REVIEW: t`На согласовании`,
    APPROVED: t`Согласован`,
    ARCHIVED: t`В архиве`,
  };
  const authorName = [
    document.author?.name?.firstName,
    document.author?.name?.lastName,
  ]
    .filter(isNonEmptyString)
    .join(' ');

  return (
    <>
      <SmbDocflowPreviewTitle title={document.name} />
      <StyledDetails>
        <StyledTerm>{t`Статус`}</StyledTerm>
        <StyledValue>
          {statusLabels[document.status ?? ''] ?? document.status ?? '—'}
        </StyledValue>
        <StyledTerm>{t`Автор`}</StyledTerm>
        <StyledValue>
          {isNonEmptyString(authorName) ? authorName : '—'}
        </StyledValue>
        <StyledTerm>{t`Создан`}</StyledTerm>
        <StyledValue>
          {formatDate(document.createdAt, 'dd.MM.yyyy HH:mm')}
        </StyledValue>
      </StyledDetails>
      <Editor document={document} />
    </>
  );
};
