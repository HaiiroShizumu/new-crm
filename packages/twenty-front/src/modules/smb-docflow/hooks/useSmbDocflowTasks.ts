import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { SMB_DOCFLOW_RUNS_LIMIT } from '@/smb-docflow/constants/SmbDocflowRunsLimit';
import { type SmbDocflowTaskWithOwnership } from '@/smb-docflow/types/SmbDocflowTaskWithOwnership';
import { getSmbDocflowTasksFromRun } from '@/smb-docflow/utils/getSmbDocflowTasksFromRun';
import { isSmbDocflowTaskMine } from '@/smb-docflow/utils/isSmbDocflowTaskMine';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isNonEmptyString } from '@sniptt/guards';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { workflowRunSchema } from 'twenty-shared/workflow';

const WORKFLOW_RUN_GQL_FIELDS = {
  id: true,
  name: true,
  status: true,
  createdAt: true,
  deletedAt: true,
  endedAt: true,
  workflowId: true,
  workflowVersionId: true,
  state: true,
  createdBy: true,
};

const readCreatorWorkspaceMemberId = (
  workflowRun: ObjectRecord,
): string | undefined => {
  const workspaceMemberId: unknown = workflowRun.createdBy?.workspaceMemberId;

  return isNonEmptyString(workspaceMemberId) ? workspaceMemberId : undefined;
};

// Who sees a task is decided by the permissions on workflow runs: this hook
// only splits what the person may read into "mine" and "the rest".
export const useSmbDocflowTasks = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const { records: workflowRuns, loading } = useFindManyRecords({
    objectNameSingular: CoreObjectNameSingular.WorkflowRun,
    filter: { status: { eq: 'RUNNING' } },
    orderBy: [{ createdAt: 'DescNullsLast' }],
    recordGqlFields: WORKFLOW_RUN_GQL_FIELDS,
    limit: SMB_DOCFLOW_RUNS_LIMIT,
  });

  const tasks = useMemo<SmbDocflowTaskWithOwnership[]>(() => {
    if (!isDefined(currentWorkspaceMember)) {
      return [];
    }

    return workflowRuns.flatMap((rawWorkflowRun) => {
      // A run whose state does not match the schema is skipped, not fatal:
      // one broken process must not hide everybody's tasks.
      const parsedWorkflowRun = workflowRunSchema.safeParse(rawWorkflowRun);

      if (!parsedWorkflowRun.success) {
        return [];
      }

      const runCreatorWorkspaceMemberId =
        readCreatorWorkspaceMemberId(rawWorkflowRun);

      return getSmbDocflowTasksFromRun(parsedWorkflowRun.data).map((task) => ({
        ...task,
        isMine: isSmbDocflowTaskMine({
          task,
          currentWorkspaceMemberId: currentWorkspaceMember.id,
          runCreatorWorkspaceMemberId,
        }),
      }));
    });
  }, [currentWorkspaceMember, workflowRuns]);

  return { tasks, loading };
};
