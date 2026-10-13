import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

export const SMB_BITRIX_MIGRATIONS: SmbMigration[] = [
  {
    name: 'bitrix/0001-create-portal-and-user-tables',
    up: async (queryRunner) => {
      // Исключение из правила «workspaceId NOT NULL» (module-authoring §5):
      // портал регистрируется при установке приложения, до привязки к компании.
      // При удалении компании портал остаётся отвязанным, а не исчезает —
      // иначе повторная установка не узнала бы его application_token.
      await queryRunner.query(
        `CREATE TABLE "smb"."bitrixPortal" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "memberId" character varying NOT NULL,
          "domain" character varying NOT NULL,
          "restEndpoint" character varying NOT NULL,
          "status" character varying NOT NULL DEFAULT 'PENDING',
          "workspaceId" uuid,
          "encryptedAccessToken" text,
          "encryptedRefreshToken" text,
          "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
          "encryptedApplicationToken" text,
          "usersSyncedAt" TIMESTAMP WITH TIME ZONE,
          "lastError" text,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_smb_bitrixPortal_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_smb_bitrixPortal_workspaceId" FOREIGN KEY ("workspaceId")
            REFERENCES "core"."workspace"("id") ON DELETE SET NULL
        )`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_BITRIX_PORTAL_MEMBER_ID"
          ON "smb"."bitrixPortal" ("memberId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_SMB_BITRIX_PORTAL_WORKSPACE_ID"
          ON "smb"."bitrixPortal" ("workspaceId")`,
      );

      await queryRunner.query(
        `CREATE TABLE "smb"."bitrixUser" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "portalId" uuid NOT NULL,
          "bitrixUserId" character varying NOT NULL,
          "userId" uuid NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_smb_bitrixUser_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_smb_bitrixUser_portalId" FOREIGN KEY ("portalId")
            REFERENCES "smb"."bitrixPortal"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_smb_bitrixUser_userId" FOREIGN KEY ("userId")
            REFERENCES "core"."user"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_BITRIX_USER_PORTAL_BITRIX_USER"
          ON "smb"."bitrixUser" ("portalId", "bitrixUserId")`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_BITRIX_USER_PORTAL_USER"
          ON "smb"."bitrixUser" ("portalId", "userId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_SMB_BITRIX_USER_USER_ID"
          ON "smb"."bitrixUser" ("userId")`,
      );
    },
  },
];
