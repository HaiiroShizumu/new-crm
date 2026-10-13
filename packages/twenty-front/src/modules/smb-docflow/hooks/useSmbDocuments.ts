import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { SMB_DOCUMENT_OBJECT_NAME_SINGULAR } from '@/smb-docflow/constants/SmbDocumentObjectNameSingular';
import { type SmbDocument } from '@/smb-docflow/types/SmbDocument';
import { isDefined } from 'twenty-shared/utils';

const SMB_DOCUMENTS_LIMIT = 200;

// Without a folder the list holds the documents that belong to none.
export const useSmbDocuments = (folderId: string | undefined) => {
  const { records: documents, loading } = useFindManyRecords<SmbDocument>({
    objectNameSingular: SMB_DOCUMENT_OBJECT_NAME_SINGULAR,
    filter: isDefined(folderId)
      ? { folderId: { eq: folderId } }
      : { folderId: { is: 'NULL' } },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    recordGqlFields: {
      id: true,
      name: true,
      status: true,
      editorKind: true,
      createdAt: true,
      folderId: true,
      file: true,
      author: { id: true, name: true },
    },
    limit: SMB_DOCUMENTS_LIMIT,
  });

  return { documents, loading };
};
