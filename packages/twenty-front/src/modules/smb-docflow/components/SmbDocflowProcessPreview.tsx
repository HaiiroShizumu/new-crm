import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { isSmbEmbedded } from '@/smb-embed/utils/isSmbEmbedded';
import { SmbDocflowForm } from '@/smb-docflow/components/SmbDocflowForm';
import { SmbDocflowPreviewTitle } from '@/smb-docflow/components/SmbDocflowPreviewTitle';
import { useLaunchSmbDocflowProcess } from '@/smb-docflow/hooks/useLaunchSmbDocflowProcess';
import { type SmbDocflowProcess } from '@/smb-docflow/types/SmbDocflowProcess';

const StyledHeader = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

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
      <StyledHeader>
        <SmbDocflowPreviewTitle title={process.name} />
        {/* Inside the portal the workflow editor of the CRM is out of reach. */}
        {!isSmbEmbedded() && (
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                to={getAppPath(AppPath.RecordShowPage, {
                  objectNameSingular: 'workflow',
                  objectRecordId: process.workflowId,
                })}
              />
            }
          >
            {t`Изменить`}
          </Button>
        )}
      </StyledHeader>
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
