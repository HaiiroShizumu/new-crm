import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type DataSource } from 'typeorm';

import { SmbNotificationEntity } from 'src/modules/smb-notifications/entities/smb-notification.entity';

export type SmbNotificationInsertProps = {
  recipientId: string;
  kind: string;
  sourceModule: string;
  deduplicationKey: string;
  payload: Record<string, unknown>;
};

export type SmbNotificationPageProps = {
  recipientId: string;
  limit: number;
  offset: number;
};

/**
 * Единственная точка доступа к `smb.notification` (ADR-010 п.2).
 *
 * `workspaceId` — обязательный первый аргумент каждого метода: фильтр по
 * компании ставится здесь, резолверы и сервисы работают только через эту
 * обёртку. SQL параметризованный, значения подставляются только через
 * placeholders.
 *
 * Обёртка `WorkspaceScopedRepository` из ядра не подходит: она строится на
 * `TypeOrmModule.forFeature`, а сущность не зарегистрирована в core DataSource
 * (см. шапку entity) — без правки ядра списка `entities` этого сделать нельзя.
 */
@Injectable()
export class SmbNotificationRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async insertIfNew(
    workspaceId: string,
    props: SmbNotificationInsertProps,
  ): Promise<SmbNotificationEntity | null> {
    const rows = await this.dataSource.query<SmbNotificationEntity[]>(
      `INSERT INTO "smb"."notification"
         ("recipientId", "kind", "sourceModule", "payload", "deduplicationKey", "workspaceId")
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       ON CONFLICT ("workspaceId", "recipientId", "deduplicationKey") DO NOTHING
       RETURNING *`,
      [
        props.recipientId,
        props.kind,
        props.sourceModule,
        JSON.stringify(props.payload),
        props.deduplicationKey,
        workspaceId,
      ],
    );

    return rows[0] ?? null;
  }

  // Одна вставка на всех получателей; повторный ключ события у получателя
  // молча пропускается (как в insertIfNew).
  async insertManyIfNew(
    workspaceId: string,
    props: Omit<SmbNotificationInsertProps, 'recipientId'> & {
      recipientIds: string[];
    },
  ): Promise<SmbNotificationEntity[]> {
    return this.dataSource.query<SmbNotificationEntity[]>(
      `INSERT INTO "smb"."notification"
         ("recipientId", "kind", "sourceModule", "payload", "deduplicationKey", "workspaceId")
       SELECT "recipient", $2, $3, $4::jsonb, $5, $6
       FROM unnest($1::uuid[]) AS "recipient"
       ON CONFLICT ("workspaceId", "recipientId", "deduplicationKey") DO NOTHING
       RETURNING *`,
      [
        props.recipientIds,
        props.kind,
        props.sourceModule,
        JSON.stringify(props.payload),
        props.deduplicationKey,
        workspaceId,
      ],
    );
  }

  // Исключение из правила «workspaceId первым аргументом»: очистка
  // обслуживающая, по умолчанию идёт по всему инстансу и удаляет только
  // прочитанное старше срока. `workspaceId` сужает её одной компанией
  // (нужен тесту на живой базе, чтобы не трогать чужие строки).
  async deleteReadOlderThan(
    retentionDays: number,
    workspaceId?: string,
  ): Promise<number> {
    const rows = await this.dataSource.query<{ deletedCount: number }[]>(
      `WITH "deleted" AS (
         DELETE FROM "smb"."notification"
         WHERE "readAt" IS NOT NULL
           AND "readAt" < now() - make_interval(days => $1::int)
           AND ($2::uuid IS NULL OR "workspaceId" = $2::uuid)
         RETURNING 1
       )
       SELECT count(*)::int AS "deletedCount" FROM "deleted"`,
      [retentionDays, workspaceId ?? null],
    );

    return rows[0]?.deletedCount ?? 0;
  }

  async findManyByRecipient(
    workspaceId: string,
    { recipientId, limit, offset }: SmbNotificationPageProps,
  ): Promise<SmbNotificationEntity[]> {
    return this.dataSource.query<SmbNotificationEntity[]>(
      `SELECT * FROM "smb"."notification"
       WHERE "workspaceId" = $1 AND "recipientId" = $2
       ORDER BY "createdAt" DESC, "id" DESC
       LIMIT $3 OFFSET $4`,
      [workspaceId, recipientId, limit, offset],
    );
  }

  async countUnread(workspaceId: string, recipientId: string): Promise<number> {
    const rows = await this.dataSource.query<{ unreadCount: number }[]>(
      `SELECT count(*)::int AS "unreadCount" FROM "smb"."notification"
       WHERE "workspaceId" = $1 AND "recipientId" = $2 AND "readAt" IS NULL`,
      [workspaceId, recipientId],
    );

    return rows[0]?.unreadCount ?? 0;
  }

  async markAllAsRead(
    workspaceId: string,
    recipientId: string,
  ): Promise<number> {
    // TypeORM 0.3 отдаёт на UPDATE кортеж [rows, rowCount] вместо самих строк.
    const [rows] = await this.dataSource.query<[[{ id: string }], number]>(
      `UPDATE "smb"."notification"
       SET "readAt" = now(), "updatedAt" = now()
       WHERE "workspaceId" = $1 AND "recipientId" = $2 AND "readAt" IS NULL
       RETURNING "id"`,
      [workspaceId, recipientId],
    );

    return rows.length;
  }
}
