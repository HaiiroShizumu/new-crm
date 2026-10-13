import { Module } from '@nestjs/common';

import { TaskUpdateOnePreHookStub } from 'src/modules/smb-core/hooks/task-update-one-pre.stub';

/**
 * Каркас серверной части форка (ADR-009 п.1, п.4): сюда регистрируются
 * серверные части модулей и общие сервисы (кэш установленных App для
 * guard'а @RequireSmbModule — TODO M-4).
 *
 * Подключается в дерево приложения единственным швом P-002
 * (см. src/engine/core-modules/core-engine.module.ts, ADR-013 п.1).
 */
@Module({
  providers: [TaskUpdateOnePreHookStub],
  exports: [],
})
export class SmbCoreModule {}
