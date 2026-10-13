import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { IconDownload, IconFile } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { downloadFile } from '@/activities/files/utils/downloadFile';
import { type SmbDocumentEditorProps } from '@/smb-docflow/types/SmbDocumentEditorProps';
import { getSmbDocumentPreviewKind } from '@/smb-docflow/utils/getSmbDocumentPreviewKind';

const StyledImage = styled.img`
  border-radius: ${themeCssVariables.border.radius.sm};
  max-width: 100%;
`;

const StyledFrame = styled.iframe`
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  height: 420px;
  width: 100%;
`;

const StyledFileBadge = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMuted = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type SmbDocumentFileViewerProps = SmbDocumentEditorProps;

// The viewer every document opens with until an editor is registered for its kind.
export const SmbDocumentFileViewer = ({
  document,
}: SmbDocumentFileViewerProps) => {
  const { t } = useLingui();
  const file = document.file?.find((candidate) => candidate.isDeleted !== true);

  if (!isDefined(file)) {
    return <StyledMuted>{t`Файл не приложен.`}</StyledMuted>;
  }

  const fileUrl = file.url;
  const previewKind = getSmbDocumentPreviewKind(file.label);

  return (
    <>
      {isNonEmptyString(fileUrl) && previewKind === 'IMAGE' && (
        <StyledImage src={fileUrl} alt={file.label} />
      )}
      {isNonEmptyString(fileUrl) && previewKind === 'PDF' && (
        <StyledFrame src={fileUrl} title={file.label} />
      )}
      <StyledFileBadge>
        <IconFile size={16} />
        {file.label}
      </StyledFileBadge>
      {isNonEmptyString(fileUrl) && (
        <Button
          startIcon={<IconDownload />}
          variant="outline"
          size="sm"
          onClick={() => downloadFile(fileUrl, file.label)}
        >
          {t`Скачать`}
        </Button>
      )}
    </>
  );
};
