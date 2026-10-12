// Таблицы форка живут в своей схеме, а не в `core` и не в схемах компаний:
// их не видит конвейер обновлений Twenty и общий API записей (ADR-013 п.2).
export const SMB_DATABASE_SCHEMA = 'smb';

export const SMB_MIGRATION_LEDGER_TABLE = '_migration';

// Произвольная константа для pg_advisory_lock: сервер и воркер стартуют
// одновременно и не должны применять одну миграцию дважды.
export const SMB_MIGRATION_ADVISORY_LOCK_KEY = 7_302_013;
