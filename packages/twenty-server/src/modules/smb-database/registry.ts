// smb:module:migration-imports
import { SMB_ORG_STRUCTURE_MIGRATIONS } from 'src/modules/smb-org-structure/migrations/smb-org-structure.migrations';
import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';
import { SMB_NOTIFICATIONS_MIGRATIONS } from 'src/modules/smb-notifications/migrations/smb-notifications.migrations';

// Все миграции таблиц форка (ADR-013 п.2). Модуль добавляет сюда одну строку
// со своим списком; порядок строк — порядок применения на чистой базе.
export const SMB_MIGRATIONS: readonly SmbMigration[] = [
  ...SMB_NOTIFICATIONS_MIGRATIONS,
  // smb:module:migrations
  ...SMB_ORG_STRUCTURE_MIGRATIONS,
];
