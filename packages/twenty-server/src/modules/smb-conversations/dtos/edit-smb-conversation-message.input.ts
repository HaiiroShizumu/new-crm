import { Field, InputType } from '@nestjs/graphql';

import { IsObject, IsUUID } from 'class-validator';
import GraphQLJSON from 'graphql-type-json';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@InputType()
export class EditSmbConversationMessageInput {
  @Field(() => UUIDScalarType)
  @IsUUID()
  messageId: string;

  @Field(() => GraphQLJSON)
  @IsObject()
  body: Record<string, unknown>;
}
