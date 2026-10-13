import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { type DataSource } from 'typeorm';

import { type SmbBitrixPortalRow } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-row.type';
import { type SmbBitrixPortalStatus } from 'src/modules/smb-bitrix/types/smb-bitrix-portal-status.type';
import { type SmbBitrixUserRow } from 'src/modules/smb-bitrix/types/smb-bitrix-user-row.type';

// Колонки, которые разрешено менять через updatePortal. Имена попадают в SQL
// как идентификаторы, поэтому берутся только из этого списка.
const UPDATABLE_PORTAL_COLUMNS = [
  'status',
  'workspaceId',
  'encryptedAccessToken',
  'encryptedRefreshToken',
  'accessTokenExpiresAt',
  'encryptedApplicationToken',
  'usersSyncedAt',
  'lastError',
] as const;

type UpdatablePortalColumn = (typeof UPDATABLE_PORTAL_COLUMNS)[number];

export type SmbBitrixPortalPatch = Partial<
  Pick<SmbBitrixPortalRow, UpdatablePortalColumn>
>;

// Единственная точка доступа к таблицам канала Б24. В отличие от остальных
// репозиториев форка, `workspaceId` здесь не первый аргумент: строка портала
// ищется по `memberId` до того, как компания известна (см. миграцию).
@Injectable()
export class SmbBitrixRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findPortalByMemberId(
    memberId: string,
  ): Promise<SmbBitrixPortalRow | null> {
    const rows = await this.dataSource.query<SmbBitrixPortalRow[]>(
      `SELECT * FROM "smb"."bitrixPortal" WHERE "memberId" = $1`,
      [memberId],
    );

    return rows[0] ?? null;
  }

  async findPortalById(portalId: string): Promise<SmbBitrixPortalRow | null> {
    const rows = await this.dataSource.query<SmbBitrixPortalRow[]>(
      `SELECT * FROM "smb"."bitrixPortal" WHERE "id" = $1`,
      [portalId],
    );

    return rows[0] ?? null;
  }

  findActivePortalsByWorkspaceId(
    workspaceId: string,
  ): Promise<SmbBitrixPortalRow[]> {
    return this.dataSource.query<SmbBitrixPortalRow[]>(
      `SELECT * FROM "smb"."bitrixPortal"
        WHERE "workspaceId" = $1 AND "status" = 'ACTIVE'`,
      [workspaceId],
    );
  }

  // ON CONFLICT, а не «найти и сохранить»: два сотрудника, открывшие приложение
  // одновременно, не должны создать две строки портала.
  async upsertPortalTokens(props: {
    memberId: string;
    domain: string;
    restEndpoint: string;
    encryptedAccessToken: string;
    encryptedRefreshToken: string;
    accessTokenExpiresAt: Date;
  }): Promise<SmbBitrixPortalRow> {
    const rows = await this.dataSource.query<SmbBitrixPortalRow[]>(
      `INSERT INTO "smb"."bitrixPortal"
         ("memberId", "domain", "restEndpoint", "encryptedAccessToken",
          "encryptedRefreshToken", "accessTokenExpiresAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("memberId") DO UPDATE SET
         "domain" = EXCLUDED."domain",
         "restEndpoint" = EXCLUDED."restEndpoint",
         "encryptedAccessToken" = EXCLUDED."encryptedAccessToken",
         "encryptedRefreshToken" = EXCLUDED."encryptedRefreshToken",
         "accessTokenExpiresAt" = EXCLUDED."accessTokenExpiresAt",
         "updatedAt" = now()
       RETURNING *`,
      [
        props.memberId,
        props.domain,
        props.restEndpoint,
        props.encryptedAccessToken,
        props.encryptedRefreshToken,
        props.accessTokenExpiresAt,
      ],
    );

    return rows[0];
  }

  async updatePortal(
    portalId: string,
    patch: SmbBitrixPortalPatch,
    { onlyIfStatus }: { onlyIfStatus?: SmbBitrixPortalStatus } = {},
  ): Promise<void> {
    const columns = UPDATABLE_PORTAL_COLUMNS.filter(
      (column) => patch[column] !== undefined,
    );

    if (columns.length === 0) {
      return;
    }

    const assignments = columns.map(
      (column, index) => `"${column}" = $${index + 2}`,
    );
    const values: unknown[] = columns.map((column) => patch[column]);
    const statusCondition =
      onlyIfStatus === undefined
        ? ''
        : ` AND "status" = $${columns.length + 2}`;

    await this.dataSource.query(
      `UPDATE "smb"."bitrixPortal"
          SET ${assignments.join(', ')}, "updatedAt" = now()
        WHERE "id" = $1${statusCondition}`,
      onlyIfStatus === undefined
        ? [portalId, ...values]
        : [portalId, ...values, onlyIfStatus],
    );
  }

  async findUserBinding(
    portalId: string,
    bitrixUserId: string,
  ): Promise<SmbBitrixUserRow | null> {
    const rows = await this.dataSource.query<SmbBitrixUserRow[]>(
      `SELECT * FROM "smb"."bitrixUser"
        WHERE "portalId" = $1 AND "bitrixUserId" = $2`,
      [portalId, bitrixUserId],
    );

    return rows[0] ?? null;
  }

  // Повтор не ошибка: синхронизация при установке и первое открытие приложения
  // могут привязывать одного человека одновременно.
  async insertUserBindingIfAbsent(props: {
    portalId: string;
    bitrixUserId: string;
    userId: string;
  }): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO "smb"."bitrixUser" ("portalId", "bitrixUserId", "userId")
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [props.portalId, props.bitrixUserId, props.userId],
    );
  }

  async isUserBoundToActivePortal(props: {
    userId: string;
    workspaceId: string;
  }): Promise<boolean> {
    const rows = await this.dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
           FROM "smb"."bitrixUser" binding
           JOIN "smb"."bitrixPortal" portal ON portal."id" = binding."portalId"
          WHERE binding."userId" = $1
            AND portal."workspaceId" = $2
            AND portal."status" = 'ACTIVE'
       ) AS "exists"`,
      [props.userId, props.workspaceId],
    );

    return rows[0]?.exists === true;
  }
}
