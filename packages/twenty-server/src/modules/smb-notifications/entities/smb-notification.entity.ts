import { Field, GraphQLISODateTime, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

/**
 * Уведомление платформы (ADR-010 п.6, TODO N-1).
 *
 * Таблица своя (`smb.notification`), создаётся миграцией форка из
 * `migrations/` (ADR-013 п.2). Сущность лежит вне глоба
 * `src/database/typeorm/core/core.datasource.ts` (там только `engine/core-modules`
 * и `engine/metadata-modules`) — поэтому чтение идёт через наш репозиторий с
 * параметризованным SQL, а не через `TypeOrmModule.forFeature`.
 */
@Entity({ name: 'notification', schema: 'smb' })
@Index('IDX_SMB_NOTIFICATION_WORKSPACE_RECIPIENT', [
  'workspaceId',
  'recipientId',
  'createdAt',
])
@Index(
  'UQ_SMB_NOTIFICATION_DEDUPLICATION',
  ['workspaceId', 'recipientId', 'deduplicationKey'],
  { unique: true },
)
@ObjectType('SmbNotification')
export class SmbNotificationEntity {
  @Field(() => UUIDScalarType)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => UUIDScalarType)
  @Column({ type: 'uuid' })
  recipientId: string;

  @Field()
  @Column()
  kind: string;

  @Field()
  @Column()
  sourceModule: string;

  @Field(() => GraphQLJSON)
  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, unknown>;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  // Ключ события для дедупликации: одна и та же строка не создаётся дважды
  // для одного участника в одной компании (ADR-010 п.6).
  @Column()
  deduplicationKey: string;

  // Компанию не отдаём в GraphQL: она приходит из контекста авторизации,
  // а не из данных уведомления.
  @Column({ type: 'uuid' })
  workspaceId: string;

  @Field()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
