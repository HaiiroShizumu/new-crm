// smb:module:migration-imports
import { SMB_TASKS_MIGRATIONS } from 'src/modules/smb-tasks/migrations/smb-tasks.migrations';
import { SMB_FEED_MIGRATIONS } from 'src/modules/smb-feed/migrations/smb-feed.migrations';
import { SMB_ABSENCES_MIGRATIONS } from 'src/modules/smb-absences/migrations/smb-absences.migrations';
import { SMB_ORG_STRUCTURE_MIGRATIONS } from 'src/modules/smb-org-structure/migrations/smb-org-structure.migrations';
import { SMB_BITRIX_MIGRATIONS } from 'src/modules/smb-bitrix/migrations/smb-bitrix.migrations';
import { SMB_CONVERSATIONS_MIGRATIONS } from 'src/modules/smb-conversations/migrations/smb-conversations.migrations';
import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';
import { SMB_NOTIFICATIONS_MIGRATIONS } from 'src/modules/smb-notifications/migrations/smb-notifications.migrations';

// Все миграции таблиц форка (ADR-013 п.2). Модуль добавляет сюда одну строку
// со своим списком; порядок строк — порядок применения на чистой базе.
export const SMB_MIGRATIONS: readonly SmbMigration[] = [
  ...SMB_NOTIFICATIONS_MIGRATIONS,
  ...SMB_CONVERSATIONS_MIGRATIONS,
  ...SMB_BITRIX_MIGRATIONS,
  // smb:module:migrations
  ...SMB_TASKS_MIGRATIONS,
  ...SMB_FEED_MIGRATIONS,
  ...SMB_ABSENCES_MIGRATIONS,
  ...SMB_ORG_STRUCTURE_MIGRATIONS,
];
