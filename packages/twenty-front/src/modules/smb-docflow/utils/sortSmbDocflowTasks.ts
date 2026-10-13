import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';

// Сроки приходят в двух видах: DATE даёт 'YYYY-MM-DD', TIMESTAMP — ISO,
// поэтому сравнивать строки нельзя, только момент времени.
const readTime = (value: string | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const time = new Date(value).getTime();

  return Number.isNaN(time) ? undefined : time;
};

export const sortSmbDocflowTasks = (
  tasks: SmbDocflowTask[],
): SmbDocflowTask[] =>
  [...tasks].sort((firstTask, secondTask) => {
    const firstDue = readTime(firstTask.dueAt);
    const secondDue = readTime(secondTask.dueAt);

    if (firstDue !== undefined && secondDue === undefined) {
      return -1;
    }

    if (firstDue === undefined && secondDue !== undefined) {
      return 1;
    }

    if (
      firstDue !== undefined &&
      secondDue !== undefined &&
      firstDue !== secondDue
    ) {
      return firstDue - secondDue;
    }

    // Равные сроки (и задания вообще без срока) — раньше то, что создано раньше.
    return (
      (readTime(firstTask.createdAt) ?? 0) -
      (readTime(secondTask.createdAt) ?? 0)
    );
  });
