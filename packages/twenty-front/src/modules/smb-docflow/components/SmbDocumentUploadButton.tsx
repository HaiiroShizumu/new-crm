import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconUpload } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';

import { useUploadSmbDocument } from '@/smb-docflow/hooks/useUploadSmbDocument';

type SmbDocumentUploadButtonProps = {
  folderId: string | undefined;
};

export const SmbDocumentUploadButton = ({
  folderId,
}: SmbDocumentUploadButtonProps) => {
  const { t } = useLingui();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadSmbDocument } = useUploadSmbDocument();

  const handleFile = async (file: File | undefined) => {
    if (!isDefined(file)) {
      return;
    }

    setIsUploading(true);

    try {
      await uploadSmbDocument({ file, folderId });
    } catch {
      // The upload hook has already told the person what went wrong.
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        aria-label={t`Файл документа`}
        onChange={(event) => {
          const file = event.target.files?.[0];

          // Reset so that picking the same file again fires the event.
          event.target.value = '';
          void handleFile(file);
        }}
      />
      <Button
        startIcon={<IconUpload />}
        variant="solid"
        size="sm"
        loading={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {t`Загрузить`}
      </Button>
    </>
  );
};
