import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

export const SMB_NOTIFICATIONS_MIGRATIONS: SmbMigration[] = [
  {
    name: 'notifications/0001-create-notification-table',
    up: async (queryRunner) => {
      await queryRunner.query(
        `CREATE TABLE "smb"."notification" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "recipientId" uuid NOT NULL,
          "kind" character varying NOT NULL,
          "sourceModule" character varying NOT NULL,
          "payload" jsonb NOT NULL DEFAULT '{}',
          "readAt" TIMESTAMP WITH TIME ZONE,
          "deduplicationKey" character varying NOT NULL,
          "workspaceId" uuid NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_smb_notification_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_smb_notification_workspaceId" FOREIGN KEY ("workspaceId")
            REFERENCES "core"."workspace"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_NOTIFICATION_DEDUPLICATION"
          ON "smb"."notification" ("workspaceId", "recipientId", "deduplicationKey")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_SMB_NOTIFICATION_WORKSPACE_RECIPIENT"
          ON "smb"."notification" ("workspaceId", "recipientId", "createdAt")`,
      );
    },
  },
];
