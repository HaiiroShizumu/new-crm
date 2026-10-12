import { Module } from '@nestjs/common';

import { SmbCoreModule } from 'src/modules/smb-core/smb-core.module';

// smb:module:imports

/**
 * SmbServerModule — единая серверная точка входа форка (ADR-007, вариант B).
 * В ядро подключается единственным швом P-002 (`src/modules/modules.module.ts`).
 *
 * Генератор `yarn smb:module new <key> --server` вставляет сюда импорт и строку
 * в `imports` по маркерам `// smb:module:imports` и `// smb:module:list`
 * (ADR-009 п.4: новый модуль не добавляет новых швов ядра).
 */
@Module({
  imports: [
    SmbCoreModule,
    // smb:module:list
  ],
  providers: [],
  exports: [],
})
export class SmbServerModule {}
