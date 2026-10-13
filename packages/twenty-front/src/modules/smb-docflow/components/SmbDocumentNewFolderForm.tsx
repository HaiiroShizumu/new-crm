import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { useToast } from 'twenty-ui/components';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { SMB_DOCUMENT_FOLDER_COLORS } from '@/smb-docflow/constants/SmbDocumentFolderColors';
import { SMB_DOCUMENT_FOLDER_OBJECT_NAME_SINGULAR } from '@/smb-docflow/constants/SmbDocumentFolderObjectNameSingular';
import { type SmbDocumentFolder } from '@/smb-docflow/types/SmbDocumentFolder';
import { type SmbDocumentFolderColor } from '@/smb-docflow/types/SmbDocumentFolderColor';
import { TextInput } from '@/ui/input/components/TextInput';

const StyledForm = styled.form`
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledSelect = styled.select`
  background: ${themeCssVariables.background.transparent.lighter};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

type SmbDocumentNewFolderFormProps = {
  parentFolderId: string | undefined;
  onDone: () => void;
};

export const SmbDocumentNewFolderForm = ({
  parentFolderId,
  onDone,
}: SmbDocumentNewFolderFormProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState<SmbDocumentFolderColor>('GRAY');
  const [isSaving, setIsSaving] = useState(false);
  const { createOneRecord } = useCreateOneRecord<SmbDocumentFolder>({
    objectNameSingular: SMB_DOCUMENT_FOLDER_OBJECT_NAME_SINGULAR,
  });

  const colorLabels: Record<SmbDocumentFolderColor, string> = {
    GRAY: t`Серый`,
    BLUE: t`Синий`,
    GREEN: t`Зелёный`,
    ORANGE: t`Оранжевый`,
    RED: t`Красный`,
    PURPLE: t`Фиолетовый`,
  };
  const trimmedName = name.trim();

  const handleSubmit = async () => {
    if (!isNonEmptyString(trimmedName)) {
      return;
    }

    setIsSaving(true);

    try {
      await createOneRecord({
        name: trimmedName,
        color,
        parentFolderId: parentFolderId ?? null,
      });
      onDone();
    } catch {
      enqueueToast({
        variant: 'error',
        children: t`Не удалось создать папку. Попробуйте ещё раз.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StyledForm
      aria-label={t`Новая папка`}
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <TextInput
        label={t`Название папки`}
        value={name}
        onChange={setName}
        fullWidth
        autoFocus
      />
      <StyledSelect
        aria-label={t`Цвет папки`}
        value={color}
        onChange={(event) =>
          setColor(
            SMB_DOCUMENT_FOLDER_COLORS.find(
              (candidate) => candidate === event.target.value,
            ) ?? 'GRAY',
          )
        }
      >
        {SMB_DOCUMENT_FOLDER_COLORS.map((folderColor) => (
          <option key={folderColor} value={folderColor}>
            {colorLabels[folderColor]}
          </option>
        ))}
      </StyledSelect>
      <StyledActions>
        <Button
          type="submit"
          variant="solid"
          size="sm"
          disabled={!isNonEmptyString(trimmedName)}
          loading={isSaving}
        >
          {t`Создать`}
        </Button>
        <Button variant="outline" size="sm" onClick={onDone}>
          {t`Отмена`}
        </Button>
      </StyledActions>
    </StyledForm>
  );
};
