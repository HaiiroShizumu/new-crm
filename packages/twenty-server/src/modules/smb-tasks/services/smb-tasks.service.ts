import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import {
  TASK_OBJECT_NAME,
  TIME_ENTRY_OBJECT_NAME,
} from 'src/modules/smb-tasks/constants/tasks.constants';
import { type ResultForm } from 'src/modules/smb-tasks/types/result-form.type';
import { findMissingResultFields } from 'src/modules/smb-tasks/utils/find-missing-result-fields.util';
import {
  isResultFormDefined,
  parseResultForm,
} from 'src/modules/smb-tasks/utils/parse-result-form.util';
import {
  computeDurationMinutes,
  findActiveTimersToStop,
  type TimeEntryLike,
} from 'src/modules/smb-tasks/utils/timer-rules.util';

type TaskRecord = {
  id: string;
  resultForm?: unknown;
  resultValues?: Record<string, unknown> | null;
};

type TimeEntryRecord = {
  id: string;
  memberId?: string | null;
  taskId?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
};

@Injectable()
export class SmbTasksService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  // T-3: обязательные поля формы, не заполненные при завершении задачи.
  // `incomingValues` — resultValues из того же запроса (если пришли).
  async findMissingRequiredFields(
    authContext: WorkspaceAuthContext,
    props: {
      taskId: string;
      incomingValues?: Record<string, unknown> | null;
      incomingForm?: unknown;
    },
  ): Promise<{ key: string; label: string }[]> {
    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository = this.workspaceOrmManager.getRepository<TaskRecord>(
        TASK_OBJECT_NAME,
        { shouldBypassPermissionChecks: true },
      );
      const task = await repository.findOne({ where: { id: props.taskId } });

      if (!isDefined(task)) {
        return [];
      }

      const rawForm = props.incomingForm ?? task.resultForm;

      if (!isResultFormDefined(rawForm)) {
        return [];
      }

      const parsed = parseResultForm(rawForm);

      if (!parsed.isValid) {
        // Сломанная форма не должна навсегда запирать задачу.
        return [];
      }

      return findMissingResultFields({
        form: parsed.form as ResultForm,
        values: props.incomingValues ?? task.resultValues ?? null,
      });
    }, authContext);
  }

  // T-6: старт таймера; активные таймеры участника останавливаются.
  async startTimer(
    authContext: WorkspaceAuthContext,
    props: { memberId: string; taskId: string; now?: string },
  ): Promise<void> {
    const now = props.now ?? new Date().toISOString();

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const repository =
        this.workspaceOrmManager.getRepository<TimeEntryRecord>(
          TIME_ENTRY_OBJECT_NAME,
          { shouldBypassPermissionChecks: true },
        );
      const entries = await repository.find({
        where: { memberId: props.memberId },
      });
      const toStop = findActiveTimersToStop({
        memberId: props.memberId,
        entries: entries.map(
          (entry): TimeEntryLike => ({
            id: entry.id,
            memberId: entry.memberId ?? '',
            endedAt: entry.endedAt ?? null,
          }),
        ),
      });

      for (const active of toStop) {
        const record = entries.find((entry) => entry.id === active.id);

        await repository.update(active.id, {
          endedAt: now,
          durationMinutes: computeDurationMinutes({
            startedAt: record?.startedAt ?? now,
            endedAt: now,
          }),
        });
      }

      await repository.insert({
        memberId: props.memberId,
        taskId: props.taskId,
        startedAt: now,
        endedAt: null,
      });
    }, authContext);
  }
}
