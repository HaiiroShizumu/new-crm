import { Field, Int, ObjectType } from '@nestjs/graphql';

import { UUIDScalarType } from 'src/engine/api/graphql/workspace-schema-builder/graphql-types/scalars';
import { SmbConversationDTO } from 'src/modules/smb-conversations/dtos/smb-conversation.dto';
import { SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';
import { SmbConversationEventType } from 'src/modules/smb-conversations/enums/smb-conversation-event-type.enum';

@ObjectType('SmbConversationEvent')
export class SmbConversationEventDTO {
  @Field(() => SmbConversationEventType)
  type: SmbConversationEventType;

  @Field(() => UUIDScalarType, { nullable: true })
  conversationId?: string | null;

  // Who caused the event: the reader for CONVERSATION_READ, the typist for TYPING.
  @Field(() => UUIDScalarType, { nullable: true })
  workspaceMemberId?: string | null;

  @Field(() => SmbConversationMessageDTO, { nullable: true })
  message?: SmbConversationMessageDTO | null;

  @Field(() => SmbConversationDTO, { nullable: true })
  conversation?: SmbConversationDTO | null;

  @Field(() => Int, { nullable: true })
  lastReadSeq?: number | null;
}
