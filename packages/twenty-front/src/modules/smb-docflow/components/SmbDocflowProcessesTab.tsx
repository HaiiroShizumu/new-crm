import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

import { SmbDocflowEmptyState } from '@/smb-docflow/components/SmbDocflowEmptyState';
import { SmbDocflowListRow } from '@/smb-docflow/components/SmbDocflowListRow';
import { SmbDocflowProcessPreview } from '@/smb-docflow/components/SmbDocflowProcessPreview';
import { SmbDocflowSplitLayout } from '@/smb-docflow/components/SmbDocflowSplitLayout';
import { useSmbDocflowProcesses } from '@/smb-docflow/hooks/useSmbDocflowProcesses';
import { getSmbFillableFormFields } from '@/smb-docflow/utils/getSmbFillableFormFields';

export const SmbDocflowProcessesTab = () => {
  const { t } = useLingui();
  const { processes, loading } = useSmbDocflowProcesses();
  const [selectedVersionId, setSelectedVersionId] = useState<
    string | undefined
  >();

  if (!loading && processes.length === 0) {
    return (
      <SmbDocflowEmptyState message={t`Процессов для запуска пока нет.`} />
    );
  }

  const selectedProcess = processes.find(
    (process) => process.workflowVersionId === selectedVersionId,
  );

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
