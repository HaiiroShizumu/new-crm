import { CommonQueryRunnerException } from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  TaskCompleteUpdateManyPreQueryHook,
  TaskCompleteUpdateOnePreQueryHook,
} from 'src/modules/smb-tasks/hooks/task-complete.pre-query.hook';
import { type SmbTasksService } from 'src/modules/smb-tasks/services/smb-tasks.service';
import { buildTaskFromTemplate } from 'src/modules/smb-tasks/utils/build-task-from-template.util';
import { findMissingResultFields } from 'src/modules/smb-tasks/utils/find-missing-result-fields.util';
import { parseResultForm } from 'src/modules/smb-tasks/utils/parse-result-form.util';
import {
  computeDurationMinutes,
  findActiveTimersToStop,
  sumDurationMinutes,
} from 'src/modules/smb-tasks/utils/timer-rules.util';

const authContext = {} as WorkspaceAuthContext;

// T-9: контракт формата настроек шага FORM — этот фикстурный документ должен
// разбираться всегда; изменение формата требует менять версию.
const VALID_FORM = {
  version: 1,
  fields: [
    { key: 'summary', label: 'Итог', type: 'text', required: true },
    { key: 'hours', label: 'Часы', type: 'number' },
    { key: 'agreed', label: 'Согласовано', type: 'boolean', required: true },
    {
      key: 'verdict',
      label: 'Вердикт',
      type: 'select',
      options: ['approve', 'reject'],
      required: true,
    },
    { key: 'doneOn', label: 'Дата', type: 'date' },
  ],
};

describe('parseResultForm (T-9, контракт формата FORM)', () => {
  it('разбирает эталонную форму', () => {
    const result = parseResultForm(VALID_FORM);

    expect(result.isValid).toBe(true);
    expect(result.isValid && result.form.fields).toHaveLength(5);
  });

  it.each([
    ['не объект', 'text'],
    ['другая версия', { version: 2, fields: [] }],
    ['fields не массив', { version: 1, fields: {} }],
  ])('отклоняет: %s', (_name, raw) => {
    expect(parseResultForm(raw).isValid).toBe(false);
  });

  it('повторяющийся key, неизвестный type и select без options — ошибки', () => {
    const result = parseResultForm({
      version: 1,
      fields: [
        { key: 'a', label: 'A', type: 'text' },
        { key: 'a', label: 'A2', type: 'text' },
        { key: 'b', label: 'B', type: 'color' },
        { key: 'c', label: 'C', type: 'select' },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(!result.isValid && result.errors).toHaveLength(3);
  });
});

describe('findMissingResultFields (T-3)', () => {
  const parsed = parseResultForm(VALID_FORM);
  const form = parsed.isValid
    ? parsed.form
    : { version: 1 as const, fields: [] };

  it('пустые обязательные поля находятся, false у boolean — заполнено', () => {
    expect(
      findMissingResultFields({
        form,
        values: { summary: '  ', agreed: false, verdict: null },
      }).map((field) => field.key),
    ).toEqual(['summary', 'verdict']);
  });

  it('без значений все обязательные не заполнены', () => {
    expect(
      findMissingResultFields({ form, values: null }).map((field) => field.key),
    ).toEqual(['summary', 'agreed', 'verdict']);
  });
});

describe('хуки завершения задачи (T-3)', () => {
  const findMissingRequiredFields = jest.fn();
  const hook = new TaskCompleteUpdateOnePreQueryHook({
    findMissingRequiredFields,
  } as unknown as SmbTasksService);

  beforeEach(() => findMissingRequiredFields.mockReset());

  it('завершение с незаполненными полями отклоняется', async () => {
    findMissingRequiredFields.mockResolvedValue([
      { key: 'summary', label: 'Итог' },
    ]);

    await expect(
      hook.execute(authContext, 'task', { id: 't1', data: { status: 'DONE' } }),
    ).rejects.toBeInstanceOf(CommonQueryRunnerException);
  });

  it('другая правка задачи форму не проверяет', async () => {
    const payload = { id: 't1', data: { title: 'x' } };

    await expect(hook.execute(authContext, 'task', payload)).resolves.toBe(
      payload,
    );
    expect(findMissingRequiredFields).not.toHaveBeenCalled();
  });

  it('завершение без недостающих полей проходит', async () => {
    findMissingRequiredFields.mockResolvedValue([]);
    const payload = { id: 't1', data: { status: 'DONE' } };

    await expect(hook.execute(authContext, 'task', payload)).resolves.toBe(
      payload,
    );
  });

  it('массовое завершение отклоняется, прочая массовая правка — нет', async () => {
    const manyHook = new TaskCompleteUpdateManyPreQueryHook();

    await expect(
      manyHook.execute(authContext, 'task', {
        filter: {},
        data: { status: 'DONE' },
      }),
    ).rejects.toBeInstanceOf(CommonQueryRunnerException);

    const payload = { filter: {}, data: { title: 'x' } };

    await expect(manyHook.execute(authContext, 'task', payload)).resolves.toBe(
      payload,
    );
  });
});

describe('таймер (T-6)', () => {
  it('находит только активные таймеры этого участника', () => {
    expect(
      findActiveTimersToStop({
        memberId: 'm1',
        entries: [
          { id: 'a', memberId: 'm1', endedAt: null },
          { id: 'b', memberId: 'm1', endedAt: '2026-10-12T10:00:00Z' },
          { id: 'c', memberId: 'm2', endedAt: null },
        ],
      }).map((entry) => entry.id),
    ).toEqual(['a']);
  });

  it('длительность в минутах, не отрицательная', () => {
    expect(
      computeDurationMinutes({
        startedAt: '2026-10-12T10:00:00Z',
        endedAt: '2026-10-12T11:30:00Z',
      }),
    ).toBe(90);
    expect(
      computeDurationMinutes({
        startedAt: '2026-10-12T11:00:00Z',
        endedAt: '2026-10-12T10:00:00Z',
      }),
    ).toBe(0);
  });

  it('сумма по задаче', () => {
    expect(
      sumDurationMinutes([{ durationMinutes: 30 }, { durationMinutes: null }]),
    ).toBe(30);
  });
});

describe('buildTaskFromTemplate (T-5)', () => {
  it('копирует форму глубоко', () => {
    const template = { name: 'Согласование', resultForm: VALID_FORM };
    const task = buildTaskFromTemplate({ template });

    expect(task.resultForm).toEqual(VALID_FORM);
    expect(task.resultForm).not.toBe(VALID_FORM);
    expect(task.title).toBe('Согласование');
  });
});
