import { Field, InputType } from '@nestjs/graphql';

import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { SMB_CONVERSATION_NAME_MAX_LENGTH } from 'src/modules/smb-conversations/constants/smb-conversation-name-max-length.constant';
import { SMB_CONVERSATION_GROUP_MAX_MEMBERS } from 'src/modules/smb-conversations/constants/smb-conversation-group-max-members.constant';

@InputType()
export class CreateSmbGroupConversationInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(SMB_CONVERSATION_NAME_MAX_LENGTH)
  name: string;

  @Field(() => [UUIDScalarType])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(SMB_CONVERSATION_GROUP_MAX_MEMBERS)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  workspaceMemberIds: string[];
}
