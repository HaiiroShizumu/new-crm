import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowListRow } from '@/smb-docflow/components/SmbDocflowListRow';
import { SmbDocflowListSkeleton } from '@/smb-docflow/components/SmbDocflowListSkeleton';
import { SmbDocflowProcessPreview } from '@/smb-docflow/components/SmbDocflowProcessPreview';
import { SmbDocflowSplitLayout } from '@/smb-docflow/components/SmbDocflowSplitLayout';
import { useSmbDocflowProcesses } from '@/smb-docflow/hooks/useSmbDocflowProcesses';
import { getSmbFillableFormFields } from '@/smb-docflow/utils/getSmbFillableFormFields';
import { isSmbEmbedded } from '@/smb-embed/utils/isSmbEmbedded';

const StyledToolbar = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

export const SmbDocflowProcessesTab = () => {
  const { t } = useLingui();
  const { processes, loading } = useSmbDocflowProcesses();
  const [selectedVersionId, setSelectedVersionId] = useState<
    string | undefined
  >();

  if (loading) {
    return <SmbDocflowListSkeleton />;
  }

  if (processes.length === 0) {
    return (
      <SmbDocflowEmptyState message={t`Процессов для запуска пока нет.`} />
    );
  }

  const selectedProcess = processes.find(
    (process) => process.workflowVersionId === selectedVersionId,
  );
  // Inside the portal the workflow editor of the CRM is out of reach.
  const canOpenWorkflowEditor = !isSmbEmbedded();

  return (
    <SmbDocflowSplitLayout
      preview={
        isDefined(selectedProcess) ? (
          <SmbDocflowProcessPreview
            key={selectedProcess.workflowVersionId}
            process={selectedProcess}
            onStarted={() => setSelectedVersionId(undefined)}
          />
        ) : undefined
      }
    >
      {canOpenWorkflowEditor && (
        <StyledToolbar>
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                to={getAppPath(AppPath.RecordIndexPage, {
                  objectNamePlural: 'workflows',
                })}
              />
            }
          >
            {t`Создать`}
          </Button>
        </StyledToolbar>
      )}
      {processes.map((process) => {
        const parameterCount = getSmbFillableFormFields(
          process.startForm?.settings.input ?? [],
        ).length;

        return (
          <SmbDocflowListRow
            key={process.workflowVersionId}
            title={process.name}
            detail={
              parameterCount > 0 ? t`Параметров: ${parameterCount}` : undefined
            }
            isSelected={process.workflowVersionId === selectedVersionId}
            onClick={() => setSelectedVersionId(process.workflowVersionId)}
          />
        );
      })}
    </SmbDocflowSplitLayout>
  );
};
