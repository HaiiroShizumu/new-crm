// Канал подписок уведомлений: полный ключ — `${SMB_NOTIFICATIONS_CHANNEL}:${workspaceId}`
// (та же схема, что у SubscriptionService). Свой канал, а не значение
// `SubscriptionChannel` — чтобы не править enum ядра.
export const SMB_NOTIFICATIONS_CHANNEL = 'SMB_NOTIFICATIONS_CHANNEL';

// Сколько уведомлений отдаётся одним запросом, если лимит не передан.
export const SMB_NOTIFICATIONS_DEFAULT_PAGE_SIZE = 20;

export const SMB_NOTIFICATIONS_MAX_PAGE_SIZE = 100;

// Предел размера payload одного уведомления (сериализованный JSON, байты):
// уведомление — ссылка на событие, а не его копия (AR-10).
export const SMB_NOTIFICATIONS_PAYLOAD_MAX_BYTES = 16 * 1024;

// Сколько получателей вставляется одним запросом в notifyMany().
export const SMB_NOTIFICATIONS_MAX_RECIPIENTS_PER_BATCH = 500;

// Прочитанные уведомления старше этого срока удаляются ежедневным cron.
export const SMB_NOTIFICATIONS_READ_RETENTION_DAYS = 30;

export const SMB_NOTIFICATIONS_CLEANUP_CRON_PATTERN = '0 3 * * *';
