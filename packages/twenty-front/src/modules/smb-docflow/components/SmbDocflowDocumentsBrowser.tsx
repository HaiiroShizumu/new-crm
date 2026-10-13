import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconFolderPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowListRow } from '@/smb-docflow/components/SmbDocflowListRow';
import { SmbDocflowListSkeleton } from '@/smb-docflow/components/SmbDocflowListSkeleton';
import { SmbDocflowSplitLayout } from '@/smb-docflow/components/SmbDocflowSplitLayout';
import { SmbDocumentFolderTree } from '@/smb-docflow/components/SmbDocumentFolderTree';
import { SmbDocumentNewFolderForm } from '@/smb-docflow/components/SmbDocumentNewFolderForm';
import { SmbDocumentPreview } from '@/smb-docflow/components/SmbDocumentPreview';
import { SmbDocumentUploadButton } from '@/smb-docflow/components/SmbDocumentUploadButton';
import { useSmbDocumentFolders } from '@/smb-docflow/hooks/useSmbDocumentFolders';
import { useSmbDocuments } from '@/smb-docflow/hooks/useSmbDocuments';
import { buildSmbDocumentFolderTree } from '@/smb-docflow/utils/buildSmbDocumentFolderTree';
import { formatDate } from '~/utils/date-utils';

const StyledColumns = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const StyledFolders = styled.nav`
  border-right: 1px solid ${themeCssVariables.border.color.light};
  flex-shrink: 0;
  overflow-y: auto;
  width: 240px;
`;

const StyledDocuments = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const StyledToolbar = styled.div`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
`;

// Rendered only in a workspace that has the docflow application: the record
// hooks below throw on an object the workspace does not know.
export const SmbDocflowDocumentsBrowser = () => {
  const { t } = useLingui();
  const [selectedFolderId, setSelectedFolderId] = useState<
    string | undefined
  >();
  const [selectedDocumentId, setSelectedDocumentId] = useState<
    string | undefined
  >();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const { folders } = useSmbDocumentFolders();
  const { documents, loading } = useSmbDocuments(selectedFolderId);

  const selectedDocument = documents.find(
    (document) => document.id === selectedDocumentId,
  );

  return (
    <SmbDocflowSplitLayout
      onClose={() => setSelectedDocumentId(undefined)}
      preview={
        isDefined(selectedDocument) ? (
          <SmbDocumentPreview
            key={selectedDocument.id}
            document={selectedDocument}
          />
        ) : undefined
      }
    >
      <StyledColumns>
        <StyledFolders aria-label={t`Папки`}>
          {isCreatingFolder && (
            <SmbDocumentNewFolderForm
              parentFolderId={selectedFolderId}
              onDone={() => setIsCreatingFolder(false)}
            />
          )}
          <SmbDocumentFolderTree
            nodes={buildSmbDocumentFolderTree(folders)}
            selectedFolderId={selectedFolderId}
            onSelect={(folderId) => {
              setSelectedFolderId(folderId);
              setSelectedDocumentId(undefined);
            }}
          />
        </StyledFolders>
        <StyledDocuments>
          <StyledToolbar>
            <SmbDocumentUploadButton folderId={selectedFolderId} />
            <Button
              startIcon={<IconFolderPlus />}
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
            >
              {t`Новая папка`}
            </Button>
          </StyledToolbar>
          {loading && <SmbDocflowListSkeleton />}
          {!loading && documents.length === 0 && (
            <SmbDocflowEmptyState message={t`В этой папке документов нет.`} />
          )}
          {!loading &&
            documents.map((document) => (
              <SmbDocflowListRow
                key={document.id}
                title={document.name}
                detail={formatDate(document.createdAt, 'dd.MM.yyyy')}
                isSelected={document.id === selectedDocumentId}
                onClick={() => setSelectedDocumentId(document.id)}
              />
            ))}
        </StyledDocuments>
      </StyledColumns>
    </SmbDocflowSplitLayout>
  );
};
