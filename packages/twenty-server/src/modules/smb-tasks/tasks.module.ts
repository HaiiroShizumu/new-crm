import { Module } from '@nestjs/common';

import {
  TaskCompleteUpdateManyPreQueryHook,
  TaskCompleteUpdateOnePreQueryHook,
} from 'src/modules/smb-tasks/hooks/task-complete.pre-query.hook';
import { SmbTasksService } from 'src/modules/smb-tasks/services/smb-tasks.service';

// Серверная часть модуля 'tasks' (ADR-011): обязательные поля результата при
// завершении (T-3), правила таймера (T-6), шаблон → задача (T-5, чистая
// функция). Резолверы таймера и шаблонов — не сделаны.
@Module({
  providers: [
    SmbTasksService,
    TaskCompleteUpdateOnePreQueryHook,
    TaskCompleteUpdateManyPreQueryHook,
  ],
  exports: [SmbTasksService],
})
export class SmbTasksModule {}
