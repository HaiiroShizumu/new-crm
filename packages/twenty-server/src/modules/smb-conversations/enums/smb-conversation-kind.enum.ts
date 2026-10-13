import { registerEnumType } from '@nestjs/graphql';

// ADR-010 п.1: одна модель бесед на всё. RECORD (чат записи) и FEED_POST
// (комментарии к новости) объявлены, чтобы таблица и API не менялись, когда
// они появятся; создаются пока только DIRECT и GROUP.
export enum SmbConversationKind {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  RECORD = 'RECORD',
  FEED_POST = 'FEED_POST',
}

registerEnumType(SmbConversationKind, { name: 'SmbConversationKind' });
