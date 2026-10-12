import { Injectable, Logger } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type ResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

/**
 * Прототип Discovery из ADR-007 (спайк A2): пустой PRE-хук `task.updateOne`
 * из нашего серверного каталога. Проверяет, что WorkspaceQueryHookExplorer
 * видит провайдер SmbServerModule, подключённого швом P-002, и что хук
 * срабатывает на updateOne задачи.
 *
 * Пустой = не меняет payload, только пишет строку в журнал. Когда заработает
 * настоящий PRE-хук завершения задачи (ADR-011 п.3, TODO T-3), заглушка
 * заменяется им.
 */
@Injectable()
@WorkspaceQueryHook({
  key: 'task.updateOne',
  type: WorkspaceQueryHookType.PRE_HOOK,
})
export class TaskUpdateOnePreHookStub
  implements WorkspacePreQueryHookInstance
{
  private readonly logger = new Logger('SmbTaskUpdateOnePreHook');

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: ResolverArgs,
  ): Promise<ResolverArgs> {
    this.logger.log(
      `smb stub: ${objectName}.updateOne workspace=${authContext.workspace?.id ?? 'unknown'}`,
    );

    return payload;
  }
}
