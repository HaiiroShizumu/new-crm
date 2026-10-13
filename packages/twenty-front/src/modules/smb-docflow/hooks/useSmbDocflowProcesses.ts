import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type SmbDocflowProcess } from '@/smb-docflow/types/SmbDocflowProcess';
import { getSmbProcessStartForm } from '@/smb-docflow/utils/getSmbProcessStartForm';
import { type WorkflowVersion } from '@/workflow/types/Workflow';
import { isNonEmptyString } from '@sniptt/guards';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type ActiveWorkflowVersion = Pick<
  WorkflowVersion,
  'id' | 'name' | 'workflowId' | 'trigger' | 'steps' | '__typename'
> & {
  workflow?: { name?: string | null } | null;
};

export const useSmbDocflowProcesses = () => {
  const { records: workflowVersions, loading } =
    useFindManyRecords<ActiveWorkflowVersion>({
      objectNameSingular: CoreObjectNameSingular.WorkflowVersion,
      filter: { status: { eq: 'ACTIVE' } },
      recordGqlFields: {
        id: true,
        name: true,
        workflowId: true,
        trigger: true,
        steps: true,
        workflow: { id: true, name: true },
      },
    });

  const processes = useMemo<SmbDocflowProcess[]>(
    () =>
      workflowVersions
        .filter((workflowVersion) => workflowVersion.trigger?.type === 'MANUAL')
        .map((workflowVersion) => ({
          workflowId: workflowVersion.workflowId,
          workflowVersionId: workflowVersion.id,
          name: isNonEmptyString(workflowVersion.workflow?.name)
            ? workflowVersion.workflow.name
            : workflowVersion.name,
          startForm: getSmbProcessStartForm({
            trigger: workflowVersion.trigger,
            steps: workflowVersion.steps,
          }),
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [workflowVersions],
  );

  return { processes, loading };
};
