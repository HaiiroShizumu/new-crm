import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

// Таблицы модуля 'tasks' в схеме smb (ADR-013 п.2). Правила:
//   * имя — 'tasks/<NNNN>-<что делает>', порядок задаёт список;
//   * применённую миграцию не править — добавлять новую;
//   * у каждой таблицы "workspaceId" uuid NOT NULL с
//     REFERENCES "core"."workspace"("id") ON DELETE CASCADE;
//   * instance-команды (@RegisteredInstanceCommand) не писать — на обновлённом
//     сервере они не выполнятся.
export const SMB_TASKS_MIGRATIONS: SmbMigration[] = [];
