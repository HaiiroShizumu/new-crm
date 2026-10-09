import { isNonEmptyString } from '@sniptt/guards';

type IsSmbTaskOverdueArgs = {
  dueAt: unknown;
  status: unknown;
};

export const isSmbTaskOverdue = ({ dueAt, status }: IsSmbTaskOverdueArgs) => {
  if (!isNonEmptyString(dueAt) || status === 'DONE') {
    return false;
  }

  const dueTime = new Date(dueAt).getTime();

  return !Number.isNaN(dueTime) && dueTime < Date.now();
};
