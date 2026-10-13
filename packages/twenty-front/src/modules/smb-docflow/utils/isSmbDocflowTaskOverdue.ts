import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';
import { isDefined } from 'twenty-shared/utils';

export const isSmbDocflowTaskOverdue = (
  task: Pick<SmbDocflowTask, 'dueAt'>,
  now: Date,
): boolean => {
  if (!isDefined(task.dueAt)) {
    return false;
  }

  const dueTime = new Date(task.dueAt).getTime();

  return Number.isFinite(dueTime) && dueTime < now.getTime();
};
