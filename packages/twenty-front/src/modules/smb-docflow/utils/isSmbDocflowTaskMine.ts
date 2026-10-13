import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';
import { isDefined } from 'twenty-shared/utils';

// A step without an assignee belongs to whoever started the process: that is
// the usual "fill in your own request" first step.
export const isSmbDocflowTaskMine = ({
  task,
  currentWorkspaceMemberId,
  runCreatorWorkspaceMemberId,
}: {
  task: Pick<SmbDocflowTask, 'assigneeWorkspaceMemberId'>;
  currentWorkspaceMemberId: string;
  runCreatorWorkspaceMemberId: string | undefined;
}): boolean =>
  isDefined(task.assigneeWorkspaceMemberId)
    ? task.assigneeWorkspaceMemberId === currentWorkspaceMemberId
    : runCreatorWorkspaceMemberId === currentWorkspaceMemberId;
