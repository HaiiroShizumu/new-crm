import { Field, Int, ObjectType } from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { SmbConversationMessageKind } from 'src/modules/smb-conversations/enums/smb-conversation-message-kind.enum';
import { type SmbConversationMessageBody } from 'src/modules/smb-conversations/types/smb-conversation-message-body.type';

@ObjectType('SmbConversationMessage')
export class SmbConversationMessageDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => UUIDScalarType)
  conversationId: string;

  @Field(() => Int)
  seq: number;

  @Field(() => SmbConversationMessageKind)
  kind: SmbConversationMessageKind;

  @Field(() => UUIDScalarType, { nullable: true })
  authorWorkspaceMemberId: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  body: SmbConversationMessageBody | null;

  @Field(() => String)
  text: string;

  @Field(() => UUIDScalarType)
  clientMessageId: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  editedAt: Date | null;

  @Field(() => Date, { nullable: true })
  deletedAt: Date | null;
}
