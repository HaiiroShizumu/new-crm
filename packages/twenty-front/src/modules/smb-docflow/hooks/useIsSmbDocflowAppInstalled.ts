import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { SMB_DOCUMENT_FOLDER_OBJECT_NAME_SINGULAR } from '@/smb-docflow/constants/SmbDocumentFolderObjectNameSingular';
import { SMB_DOCUMENT_OBJECT_NAME_SINGULAR } from '@/smb-docflow/constants/SmbDocumentObjectNameSingular';

// Folders and documents are objects of the docflow application. A workspace
// without it has no such objects, and the record hooks throw on an unknown
// object, so this is checked before any of them is rendered.
export const useIsSmbDocflowAppInstalled = (): boolean => {
  const { objectMetadataItems } = useObjectMetadataItems();

  return [
    SMB_DOCUMENT_OBJECT_NAME_SINGULAR,
    SMB_DOCUMENT_FOLDER_OBJECT_NAME_SINGULAR,
  ].every((objectNameSingular) =>
    objectMetadataItems.some(
      (objectMetadataItem) =>
        objectMetadataItem.nameSingular === objectNameSingular &&
        objectMetadataItem.isActive,
    ),
  );
};
