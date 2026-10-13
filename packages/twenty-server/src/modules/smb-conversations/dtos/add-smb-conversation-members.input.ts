import { Field, InputType } from '@nestjs/graphql';

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsUUID,
} from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { SMB_CONVERSATION_GROUP_MAX_MEMBERS } from 'src/modules/smb-conversations/constants/smb-conversation-group-max-members.constant';

@InputType()
export class AddSmbConversationMembersInput {
  @Field(() => UUIDScalarType)
  @IsUUID()
  conversationId: string;

  @Field(() => [UUIDScalarType])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SMB_CONVERSATION_GROUP_MAX_MEMBERS)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  workspaceMemberIds: string[];
}
