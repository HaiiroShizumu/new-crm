import { type SmbMigration } from 'src/modules/smb-database/types/smb-migration.type';

export const SMB_CONVERSATIONS_MIGRATIONS: SmbMigration[] = [
  {
    name: 'conversations/0001-create-conversation-tables',
    up: async (queryRunner) => {
      await queryRunner.query(
        `CREATE TABLE "smb"."conversation" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "workspaceId" uuid NOT NULL,
          "kind" character varying NOT NULL,
          "name" character varying,
          "directKey" character varying,
          "objectNameSingular" character varying,
          "recordId" uuid,
          "createdByWorkspaceMemberId" uuid NOT NULL,
          "lastSeq" integer NOT NULL DEFAULT 0,
          "lastMessageAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_smb_conversation_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_smb_conversation_workspaceId" FOREIGN KEY ("workspaceId")
            REFERENCES "core"."workspace"("id") ON DELETE CASCADE
        )`,
      );
      // Один личный диалог на пару: гарантия базы, а не проверка в коде.
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_CONVERSATION_DIRECT_KEY"
          ON "smb"."conversation" ("workspaceId", "directKey")
          WHERE "directKey" IS NOT NULL`,
      );

      await queryRunner.query(
        `CREATE TABLE "smb"."conversationMember" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "workspaceId" uuid NOT NULL,
          "conversationId" uuid NOT NULL,
          "workspaceMemberId" uuid NOT NULL,
          "role" character varying NOT NULL DEFAULT 'MEMBER',
          "lastReadSeq" integer NOT NULL DEFAULT 0,
          "mutedUntil" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_smb_conversationMember_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_smb_conversationMember_workspaceId" FOREIGN KEY ("workspaceId")
            REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_smb_conversationMember_conversationId" FOREIGN KEY ("conversationId")
            REFERENCES "smb"."conversation"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_CONVERSATION_MEMBER"
          ON "smb"."conversationMember" ("conversationId", "workspaceMemberId")`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_SMB_CONVERSATION_MEMBER_WORKSPACE_MEMBER"
          ON "smb"."conversationMember" ("workspaceId", "workspaceMemberId")`,
      );

      await queryRunner.query(
        `CREATE TABLE "smb"."conversationMessage" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "workspaceId" uuid NOT NULL,
          "conversationId" uuid NOT NULL,
          "seq" integer NOT NULL,
          "kind" character varying NOT NULL DEFAULT 'TEXT',
          "authorWorkspaceMemberId" uuid,
          "body" jsonb,
          "text" text NOT NULL DEFAULT '',
          "clientMessageId" uuid NOT NULL,
          "replyToMessageId" uuid,
          "editedAt" TIMESTAMP WITH TIME ZONE,
          "deletedAt" TIMESTAMP WITH TIME ZONE,
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          CONSTRAINT "PK_smb_conversationMessage_id" PRIMARY KEY ("id"),
          CONSTRAINT "FK_smb_conversationMessage_workspaceId" FOREIGN KEY ("workspaceId")
            REFERENCES "core"."workspace"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_smb_conversationMessage_conversationId" FOREIGN KEY ("conversationId")
            REFERENCES "smb"."conversation"("id") ON DELETE CASCADE
        )`,
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_CONVERSATION_MESSAGE_SEQ"
          ON "smb"."conversationMessage" ("conversationId", "seq")`,
      );
      // Повторная отправка упирается в этот индекс и не создаёт дубль.
      await queryRunner.query(
        `CREATE UNIQUE INDEX "UQ_SMB_CONVERSATION_MESSAGE_CLIENT_MESSAGE_ID"
          ON "smb"."conversationMessage" ("conversationId", "clientMessageId")`,
      );
    },
  },
];
