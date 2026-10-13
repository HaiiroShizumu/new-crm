import { Module } from '@nestjs/common';

import { SmbConversationsModule } from 'src/modules/smb-conversations/smb-conversations.module';
import { SmbCoreModule } from 'src/modules/smb-core/smb-core.module';

// smb:module:imports
import { SmbTasksModule } from './smb-tasks/tasks.module';
import { SmbFeedModule } from './smb-feed/feed.module';
import { SmbAbsencesModule } from './smb-absences/absences.module';
import { SmbOrgStructureModule } from './smb-org-structure/org-structure.module';
import { SmbDatabaseModule } from 'src/modules/smb-database/smb-database.module';
import { SmbModulesModule } from 'src/modules/smb-modules/smb-modules.module';
import { SmbNotificationsModule } from 'src/modules/smb-notifications/smb-notifications.module';

/**
 * SmbServerModule — единая серверная точка входа форка (ADR-007, вариант B).
 * В ядро подключается единственным швом P-002 в `CoreEngineModule`: это дерево
 * грузят и сервер, и воркер, и CLI, и по нему собирается схема `/graphql`
 * (ADR-013 п.1).
 *
 * Генератор `yarn smb:module new <key> --server` вставляет сюда импорт и строку
 * в `imports` по маркерам `// smb:module:imports` и `// smb:module:list`
 * (ADR-009 п.4: новый модуль не добавляет новых швов ядра).
 */
@Module({
  imports: [
    SmbCoreModule,
    SmbDatabaseModule,
    SmbModulesModule,
    SmbNotificationsModule,
    SmbConversationsModule,
    // smb:module:list
    SmbTasksModule,
    SmbFeedModule,
    SmbAbsencesModule,
    SmbOrgStructureModule,
  ],
  providers: [],
  exports: [],
})
export class SmbServerModule {}
