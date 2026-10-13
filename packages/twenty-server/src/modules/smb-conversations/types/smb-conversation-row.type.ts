import { type SmbConversationKind } from 'src/modules/smb-conversations/enums/smb-conversation-kind.enum';

// Строка `smb.conversation`. Таблицы форка не зарегистрированы в DataSource
// ядра (ADR-013 п.2), поэтому это тип результата SQL, а не TypeORM-сущность.
export type SmbConversationRow = {
  id: string;
  workspaceId: string;
  kind: SmbConversationKind;
  name: string | null;
  directKey: string | null;
  objectNameSingular: string | null;
  recordId: string | null;
  createdByWorkspaceMemberId: string;
  lastSeq: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
