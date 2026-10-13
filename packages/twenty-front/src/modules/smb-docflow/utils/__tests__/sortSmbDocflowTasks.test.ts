import { type SmbDocflowTask } from '@/smb-docflow/types/SmbDocflowTask';
import { sortSmbDocflowTasks } from '@/smb-docflow/utils/sortSmbDocflowTasks';

const buildTask = (
  overrides: Partial<SmbDocflowTask> = {},
): SmbDocflowTask => ({
  id: 'task',
  workflowRunId: 'run-1',
  workflowRunName: '#1 Процесс',
  stepId: 'step-1',
  title: 'Шаг',
  threadId: undefined,
  assigneeWorkspaceMemberId: undefined,
  dueAt: undefined,
  createdAt: '2026-10-01T00:00:00.000Z',
  fields: [],
  ...overrides,
});

describe('sortSmbDocflowTasks', () => {
  it('сортирует по сроку по возрастанию, несмотря на разный формат дат', () => {
    const tasks = [
      buildTask({
        id: 'without-format',
        dueAt: '2026-10-20T09:00:00.000Z',
      }),
      buildTask({ id: 'middle', dueAt: '2026-10-15' }),
      buildTask({ id: 'earliest', dueAt: '2026-10-12' }),
    ];

    expect(sortSmbDocflowTasks(tasks).map((task) => task.id)).toEqual([
      'earliest',
      'middle',
      'without-format',
    ]);
  });

  it('кладёт задания без срока в конец', () => {
    const tasks = [
      buildTask({ id: 'no-due', dueAt: undefined }),
      buildTask({ id: 'with-due', dueAt: '2026-10-15' }),
      buildTask({ id: 'no-due-2', dueAt: undefined }),
      buildTask({ id: 'with-due-2', dueAt: '2026-10-10' }),
    ];

    expect(sortSmbDocflowTasks(tasks).map((task) => task.id)).toEqual([
      'with-due-2',
      'with-due',
      'no-due',
      'no-due-2',
    ]);
  });

  it('при равенстве сроков расставляет по дате создания', () => {
    const tasks = [
      buildTask({
        id: 'created-later',
        dueAt: '2026-10-15',
        createdAt: '2026-10-02T00:00:00.000Z',
      }),
      buildTask({
        id: 'created-earlier',
        dueAt: '2026-10-15',
        createdAt: '2026-10-01T00:00:00.000Z',
      }),
    ];

    expect(sortSmbDocflowTasks(tasks).map((task) => task.id)).toEqual([
      'created-earlier',
      'created-later',
    ]);
  });

  it('задания без срока тоже разводит по дате создания', () => {
    const tasks = [
      buildTask({
        id: 'no-due-later',
        createdAt: '2026-10-05T00:00:00.000Z',
      }),
      buildTask({
        id: 'no-due-earlier',
        createdAt: '2026-10-03T00:00:00.000Z',
      }),
    ];

    expect(sortSmbDocflowTasks(tasks).map((task) => task.id)).toEqual([
      'no-due-earlier',
      'no-due-later',
    ]);
  });

  it('возвращает тот же порядок для массива из одного элемента и пустой массив', () => {
    expect(sortSmbDocflowTasks([])).toEqual([]);
    expect(sortSmbDocflowTasks([buildTask({ id: 'only' })])).toHaveLength(1);
  });

  it('не меняет исходный массив', () => {
    const tasks = [
      buildTask({ id: 'later', dueAt: '2026-10-20' }),
      buildTask({ id: 'earlier', dueAt: '2026-10-10' }),
    ];
    const copy = [...tasks];

    const sorted = sortSmbDocflowTasks(tasks);

    expect(sorted).not.toBe(tasks);
    expect(tasks).toEqual(copy);
    expect(sorted.map((task) => task.id)).toEqual(['earlier', 'later']);
  });
});
