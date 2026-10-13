import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';

@ObjectType('SmbConversationMember')
export class SmbConversationMemberDTO {
  @Field(() => UUIDScalarType)
  workspaceMemberId: string;

  @Field(() => Int)
  lastReadSeq: number;
}
