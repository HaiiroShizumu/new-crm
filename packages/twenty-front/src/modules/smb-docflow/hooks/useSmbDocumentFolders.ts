import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { SMB_DOCUMENT_FOLDER_OBJECT_NAME_SINGULAR } from '@/smb-docflow/constants/SmbDocumentFolderObjectNameSingular';
import { type SmbDocumentFolder } from '@/smb-docflow/types/SmbDocumentFolder';

const SMB_DOCUMENT_FOLDERS_LIMIT = 500;

export const useSmbDocumentFolders = () => {
  const { records: folders, loading } = useFindManyRecords<SmbDocumentFolder>({
    objectNameSingular: SMB_DOCUMENT_FOLDER_OBJECT_NAME_SINGULAR,
    recordGqlFields: {
      id: true,
      name: true,
      color: true,
      parentFolderId: true,
    },
    limit: SMB_DOCUMENT_FOLDERS_LIMIT,
  });

  return { folders, loading };
};
