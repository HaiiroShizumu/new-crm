import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type DataSource } from 'typeorm';

import { type SmbConversationKind } from 'src/modules/smb-conversations/enums/smb-conversation-kind.enum';
import { type SmbConversationMessageKind } from 'src/modules/smb-conversations/enums/smb-conversation-message-kind.enum';
import { type SmbConversationMemberRole } from 'src/modules/smb-conversations/types/smb-conversation-member-role.type';
import { type SmbConversationMemberRow } from 'src/modules/smb-conversations/types/smb-conversation-member-row.type';
import { type SmbConversationMessageBody } from 'src/modules/smb-conversations/types/smb-conversation-message-body.type';
import { type SmbConversationMessageRow } from 'src/modules/smb-conversations/types/smb-conversation-message-row.type';
import { type SmbConversationRow } from 'src/modules/smb-conversations/types/smb-conversation-row.type';

// Единственная точка доступа к таблицам бесед (ADR-010 п.2). `workspaceId` —
// обязательный первый аргумент каждого метода и условие каждого запроса:
// сервисы и резолверы не могут обратиться к таблицам в обход фильтра компании.
// Значения попадают в SQL только через placeholders.
@Injectable()
export class SmbConversationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findConversationById(
    workspaceId: string,
    conversationId: string,
  ): Promise<SmbConversationRow | null> {
    const rows = await this.dataSource.query<SmbConversationRow[]>(
      `SELECT * FROM "smb"."conversation" WHERE "workspaceId" = $1 AND "id" = $2`,
      [workspaceId, conversationId],
    );

    return rows[0] ?? null;
  }

  findConversationsByIds(
    workspaceId: string,
    conversationIds: string[],
  ): Promise<SmbConversationRow[]> {
    return this.dataSource.query<SmbConversationRow[]>(
      `SELECT * FROM "smb"."conversation"
        WHERE "workspaceId" = $1 AND "id" = ANY($2::uuid[])`,
      [workspaceId, conversationIds],
    );
  }

  async findDirectConversation(
    workspaceId: string,
    directKey: string,
  ): Promise<SmbConversationRow | null> {
    const rows = await this.dataSource.query<SmbConversationRow[]>(
      `SELECT * FROM "smb"."conversation"
        WHERE "workspaceId" = $1 AND "directKey" = $2`,
      [workspaceId, directKey],
    );

    return rows[0] ?? null;
  }

  // Возвращает null, если личный диалог с таким ключом уже создал параллельный
  // запрос: уникальный индекс оставил один, вызывающий перечитывает его.
  async insertConversation(
    workspaceId: string,
    props: {
      kind: SmbConversationKind;
      name: string | null;
      directKey: string | null;
      createdByWorkspaceMemberId: string;
    },
  ): Promise<SmbConversationRow | null> {
    const rows = await this.dataSource.query<SmbConversationRow[]>(
      `INSERT INTO "smb"."conversation"
         ("workspaceId", "kind", "name", "directKey", "createdByWorkspaceMemberId")
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("workspaceId", "directKey") WHERE "directKey" IS NOT NULL
       DO NOTHING
       RETURNING *`,
      [
        workspaceId,
        props.kind,
        props.name,
        props.directKey,
        props.createdByWorkspaceMemberId,
      ],
    );

    return rows[0] ?? null;
  }

  async findMembership(
    workspaceId: string,
    conversationId: string,
    workspaceMemberId: string,
  ): Promise<SmbConversationMemberRow | null> {
    const rows = await this.dataSource.query<SmbConversationMemberRow[]>(
      `SELECT * FROM "smb"."conversationMember"
        WHERE "workspaceId" = $1 AND "conversationId" = $2 AND "workspaceMemberId" = $3`,
      [workspaceId, conversationId, workspaceMemberId],
    );

    return rows[0] ?? null;
  }

  findMembershipsOfWorkspaceMember(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<SmbConversationMemberRow[]> {
    return this.dataSource.query<SmbConversationMemberRow[]>(
      `SELECT * FROM "smb"."conversationMember"
        WHERE "workspaceId" = $1 AND "workspaceMemberId" = $2`,
      [workspaceId, workspaceMemberId],
    );
  }

  findMembers(
    workspaceId: string,
    conversationIds: string[],
  ): Promise<SmbConversationMemberRow[]> {
    return this.dataSource.query<SmbConversationMemberRow[]>(
      `SELECT * FROM "smb"."conversationMember"
        WHERE "workspaceId" = $1 AND "conversationId" = ANY($2::uuid[])
        ORDER BY "createdAt" ASC, "id" ASC`,
      [workspaceId, conversationIds],
    );
  }

  // Повторное добавление того же участника — не ошибка и не вторая строка.
  // Возвращает число реально добавленных.
  async insertMembersIfAbsent(
    workspaceId: string,
    props: {
      conversationId: string;
      members: { workspaceMemberId: string; role: SmbConversationMemberRole }[];
      lastReadSeq: number;
    },
  ): Promise<number> {
    const rows = await this.dataSource.query<{ id: string }[]>(
      `INSERT INTO "smb"."conversationMember"
         ("workspaceId", "conversationId", "workspaceMemberId", "role", "lastReadSeq")
       SELECT $1, $2, member."workspaceMemberId", member."role", $4
         FROM jsonb_to_recordset($3::jsonb)
           AS member("workspaceMemberId" uuid, "role" character varying)
       ON CONFLICT ("conversationId", "workspaceMemberId") DO NOTHING
       RETURNING "id"`,
      [
        workspaceId,
        props.conversationId,
        JSON.stringify(props.members),
        props.lastReadSeq,
      ],
    );

    return rows.length;
  }

  // Позиция чтения только растёт: две вкладки, отметившие прочтение не по
  // порядку, не откатят её назад.
  async advanceLastReadSeq(
    workspaceId: string,
    props: {
      conversationId: string;
      workspaceMemberId: string;
      seq: number;
    },
  ): Promise<void> {
    await this.dataSource.query(
      `UPDATE "smb"."conversationMember"
          SET "lastReadSeq" = $4, "updatedAt" = now()
        WHERE "workspaceId" = $1 AND "conversationId" = $2
          AND "workspaceMemberId" = $3 AND "lastReadSeq" < $4`,
      [workspaceId, props.conversationId, props.workspaceMemberId, props.seq],
    );
  }

  findMessages(
    workspaceId: string,
    props: {
      conversationId: string;
      beforeSeq: number | null;
      afterSeq: number | null;
      limit: number;
    },
  ): Promise<SmbConversationMessageRow[]> {
    // afterSeq — дочитывание после обрыва связи, идёт вперёд; всё остальное
    // листает назад от самого нового.
    if (props.afterSeq !== null) {
      return this.dataSource.query<SmbConversationMessageRow[]>(
        `SELECT * FROM "smb"."conversationMessage"
          WHERE "workspaceId" = $1 AND "conversationId" = $2 AND "seq" > $3
          ORDER BY "seq" ASC LIMIT $4`,
        [workspaceId, props.conversationId, props.afterSeq, props.limit],
      );
    }

    return this.dataSource.query<SmbConversationMessageRow[]>(
      `SELECT * FROM "smb"."conversationMessage"
        WHERE "workspaceId" = $1 AND "conversationId" = $2
          AND ($3::integer IS NULL OR "seq" < $3)
        ORDER BY "seq" DESC LIMIT $4`,
      [workspaceId, props.conversationId, props.beforeSeq, props.limit],
    );
  }

  async findMessageById(
    workspaceId: string,
    messageId: string,
  ): Promise<SmbConversationMessageRow | null> {
    const rows = await this.dataSource.query<SmbConversationMessageRow[]>(
      `SELECT * FROM "smb"."conversationMessage"
        WHERE "workspaceId" = $1 AND "id" = $2`,
      [workspaceId, messageId],
    );

    return rows[0] ?? null;
  }

  async findMessageByClientMessageId(
    workspaceId: string,
    conversationId: string,
    clientMessageId: string,
  ): Promise<SmbConversationMessageRow | null> {
    const rows = await this.dataSource.query<SmbConversationMessageRow[]>(
      `SELECT * FROM "smb"."conversationMessage"
        WHERE "workspaceId" = $1 AND "conversationId" = $2 AND "clientMessageId" = $3`,
      [workspaceId, conversationId, clientMessageId],
    );

    return rows[0] ?? null;
  }

  // Последнее сообщение каждой беседы одним запросом — для списка бесед.
  findLastMessages(
    workspaceId: string,
    conversationIds: string[],
  ): Promise<SmbConversationMessageRow[]> {
    return this.dataSource.query<SmbConversationMessageRow[]>(
      `SELECT message.*
         FROM "smb"."conversationMessage" message
         JOIN "smb"."conversation" conversation
           ON conversation."id" = message."conversationId"
          AND conversation."lastSeq" = message."seq"
        WHERE message."workspaceId" = $1
          AND conversation."workspaceId" = $1
          AND conversation."id" = ANY($2::uuid[])`,
      [workspaceId, conversationIds],
    );
  }

  // Номер и вставка — один оператор. Если вставка падает (повтор
  // clientMessageId), откатывается и выданный номер: беседа никогда не
  // указывает на сообщение, которого нет, и два параллельных отправителя не
  // получают один seq (UPDATE блокирует строку беседы).
  // Возвращает null, если беседы нет в этой компании.
  async insertMessageWithNextSeq(
    workspaceId: string,
    props: {
      conversationId: string;
      kind: SmbConversationMessageKind;
      authorWorkspaceMemberId: string | null;
      body: SmbConversationMessageBody | null;
      text: string;
      clientMessageId: string;
    },
  ): Promise<SmbConversationMessageRow | null> {
    const rows = await this.dataSource.query<SmbConversationMessageRow[]>(
      `WITH next AS (
         UPDATE "smb"."conversation"
            SET "lastSeq" = "lastSeq" + 1, "lastMessageAt" = now(), "updatedAt" = now()
          WHERE "workspaceId" = $1 AND "id" = $2
          RETURNING "lastSeq"
       )
       INSERT INTO "smb"."conversationMessage"
         ("workspaceId", "conversationId", "seq", "kind",
          "authorWorkspaceMemberId", "body", "text", "clientMessageId")
       SELECT $1, $2, next."lastSeq", $3, $4, $5::jsonb, $6, $7 FROM next
       RETURNING *`,
      [
        workspaceId,
        props.conversationId,
        props.kind,
        props.authorWorkspaceMemberId,
        props.body === null ? null : JSON.stringify(props.body),
        props.text,
        props.clientMessageId,
      ],
    );

    return rows[0] ?? null;
  }

  // UPDATE … RETURNING обёрнут в CTE: для команды UPDATE драйвер TypeORM
  // возвращает пару [строки, число], а для SELECT — просто строки.
  async updateMessageContent(
    workspaceId: string,
    props: {
      messageId: string;
      body: SmbConversationMessageBody;
      text: string;
    },
  ): Promise<SmbConversationMessageRow | null> {
    const rows = await this.dataSource.query<SmbConversationMessageRow[]>(
      `WITH "updated" AS (
         UPDATE "smb"."conversationMessage"
            SET "body" = $3::jsonb, "text" = $4, "editedAt" = now()
          WHERE "workspaceId" = $1 AND "id" = $2 AND "deletedAt" IS NULL
          RETURNING *
       )
       SELECT * FROM "updated"`,
      [workspaceId, props.messageId, JSON.stringify(props.body), props.text],
    );

    return rows[0] ?? null;
  }

  // Строка остаётся: номера идут подряд, счётчики непрочитанного сходятся.
  // Уходит только содержимое.
  async clearMessageContent(
    workspaceId: string,
    messageId: string,
  ): Promise<SmbConversationMessageRow | null> {
    const rows = await this.dataSource.query<SmbConversationMessageRow[]>(
      `WITH "updated" AS (
         UPDATE "smb"."conversationMessage"
            SET "body" = NULL, "text" = '', "deletedAt" = now()
          WHERE "workspaceId" = $1 AND "id" = $2 AND "deletedAt" IS NULL
          RETURNING *
       )
       SELECT * FROM "updated"`,
      [workspaceId, messageId],
    );

    return rows[0] ?? null;
  }
}
