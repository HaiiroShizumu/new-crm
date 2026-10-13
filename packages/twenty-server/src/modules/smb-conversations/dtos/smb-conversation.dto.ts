import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { SmbConversationMemberDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-member.dto';
import { SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';
import { SmbConversationKind } from 'src/modules/smb-conversations/enums/smb-conversation-kind.enum';

@ObjectType('SmbConversation')
export class SmbConversationDTO {
  @Field(() => UUIDScalarType)
  id: string;

  @Field(() => SmbConversationKind)
  kind: SmbConversationKind;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => [SmbConversationMemberDTO])
  members: SmbConversationMemberDTO[];

  @Field(() => Int)
  lastSeq: number;

  @Field(() => Int)
  lastReadSeq: number;

  @Field(() => Int)
  unreadCount: number;

  @Field(() => SmbConversationMessageDTO, { nullable: true })
  lastMessage: SmbConversationMessageDTO | null;

  @Field(() => Date, { nullable: true })
  lastMessageAt: Date | null;

  @Field(() => Date, { nullable: true })
  mutedUntil: Date | null;

  @Field(() => Date)
  createdAt: Date;
}
