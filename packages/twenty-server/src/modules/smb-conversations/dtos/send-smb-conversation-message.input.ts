import { Field, InputType } from '@nestjs/graphql';

import { IsObject, IsUUID } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class SendSmbConversationMessageInput {
  @Field(() => UUIDScalarType)
  @IsUUID()
  conversationId: string;

  @Field(() => UUIDScalarType)
  @IsUUID()
  clientMessageId: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  body: Record<string, unknown>;
}
