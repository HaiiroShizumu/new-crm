import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useUploadFilesFieldFile } from '@/object-record/record-field/ui/meta-types/hooks/useUploadFilesFieldFile';
import { SMB_DOCUMENT_FILE_FIELD_NAME } from '@/smb-docflow/constants/SmbDocumentFileFieldName';
import { SMB_DOCUMENT_OBJECT_NAME_SINGULAR } from '@/smb-docflow/constants/SmbDocumentObjectNameSingular';
import { type SmbDocument } from '@/smb-docflow/types/SmbDocument';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isDefined } from 'twenty-shared/utils';

// A document is a record whose FILES field holds the file, so the upload goes
// the way that field uploads, not the way record attachments do: an
// attachment would leave the field empty.
export const useUploadSmbDocument = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { objectMetadataItems } = useObjectMetadataItems();
  const { uploadFile } = useUploadFilesFieldFile();
  const { createOneRecord } = useCreateOneRecord<SmbDocument>({
    objectNameSingular: SMB_DOCUMENT_OBJECT_NAME_SINGULAR,
  });

  const fileFieldMetadataId = objectMetadataItems
    .find(
      (objectMetadataItem) =>
        objectMetadataItem.nameSingular === SMB_DOCUMENT_OBJECT_NAME_SINGULAR,
    )
    ?.fields.find((field) => field.name === SMB_DOCUMENT_FILE_FIELD_NAME)?.id;

  const uploadSmbDocument = async ({
    file,
    folderId,
  }: {
    file: File;
    folderId: string | undefined;
  }) => {
    if (!isDefined(fileFieldMetadataId)) {
      throw new Error('The document object has no file field');
    }

    const uploadedFile = await uploadFile(file, fileFieldMetadataId);

    return createOneRecord({
      name: file.name,
      file: [{ fileId: uploadedFile.fileId, label: uploadedFile.label }],
      folderId: folderId ?? null,
      authorId: currentWorkspaceMember?.id ?? null,
    });
  };

  return { uploadSmbDocument };
};
