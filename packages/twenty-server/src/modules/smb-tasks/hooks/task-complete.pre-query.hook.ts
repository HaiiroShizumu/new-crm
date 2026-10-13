import { msg } from '@lingui/core/macro';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type UpdateManyResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { TASK_DONE_STATUS } from 'src/modules/smb-tasks/constants/tasks.constants';
import { SmbTasksService } from 'src/modules/smb-tasks/services/smb-tasks.service';

// T-3 (ADR-011 п.3): задачу нельзя завершить, пока не заполнены обязательные
// поля формы результата. Ошибка называет ключи полей — по ним клиент
// подсвечивает форму.
@WorkspaceQueryHook('task.updateOne')
export class TaskCompleteUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly tasksService: SmbTasksService) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs,
  ): Promise<UpdateOneResolverArgs> {
    if (payload.data.status !== TASK_DONE_STATUS) {
      return payload;
    }

    const missingFields = await this.tasksService.findMissingRequiredFields(
      authContext,
      {
        taskId: payload.id,
        incomingValues: payload.data.resultValues as
          | Record<string, unknown>
          | null
          | undefined,
        incomingForm: payload.data.resultForm,
      },
    );

    if (missingFields.length > 0) {
      const fieldsList = missingFields
        .map((field) => `${field.label} (${field.key})`)
        .join(', ');

      throw new CommonQueryRunnerException(
        `Required result fields are not filled: ${missingFields
          .map((field) => field.key)
          .join(', ')}`,
        CommonQueryRunnerExceptionCode.INVALID_ARGS_DATA,
        {
          userFriendlyMessage: msg`Заполните обязательные поля результата: ${fieldsList}`,
        },
      );
    }

    return payload;
  }
}

// Массовое завершение не проверяет форму каждой задачи — завершать по одной.
@WorkspaceQueryHook('task.updateMany')
export class TaskCompleteUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    if (payload.data.status === TASK_DONE_STATUS) {
      throw new CommonQueryRunnerException(
        'Bulk completion of tasks is not allowed.',
        CommonQueryRunnerExceptionCode.BAD_REQUEST,
        {
          userFriendlyMessage: msg`Задачи с формой результата завершаются по одной.`,
        },
      );
    }

    return payload;
  }
}
