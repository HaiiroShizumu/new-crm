import { useLingui } from '@lingui/react/macro';
import { useToast } from 'twenty-ui/components';

import { SmbDocflowForm } from '@/smb-docflow/components/SmbDocflowForm';
import { SmbDocflowPreviewTitle } from '@/smb-docflow/components/SmbDocflowPreviewTitle';
import { useLaunchSmbDocflowProcess } from '@/smb-docflow/hooks/useLaunchSmbDocflowProcess';
import { type SmbDocflowProcess } from '@/smb-docflow/types/SmbDocflowProcess';

type SmbDocflowProcessPreviewProps = {
  process: SmbDocflowProcess;
  onStarted: () => void;
};

export const SmbDocflowProcessPreview = ({
  process,
  onStarted,
}: SmbDocflowProcessPreviewProps) => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { launchSmbDocflowProcess } = useLaunchSmbDocflowProcess();

  return (
    <>
      <SmbDocflowPreviewTitle title={process.name} />
      <SmbDocflowForm
        fields={process.startForm?.settings.input ?? []}
        submitLabel={t`Запустить`}
        onSubmit={async (values) => {
          try {
            const result = await launchSmbDocflowProcess({ process, values });

            if (result.status === 'MISSING_REQUIRED') {
              return result.fields;
            }

            enqueueToast({
              variant: 'success',
              children:
                result.status === 'STARTED'
                  ? t`Процесс запущен.`
                  : t`Процесс запущен. Заполните его форму в заданиях.`,
            });
            onStarted();
          } catch {
            enqueueToast({
              variant: 'error',
              children: t`Не удалось запустить процесс. Попробуйте ещё раз.`,
            });
          }

          return [];
        }}
      />
    </>
  );
};
