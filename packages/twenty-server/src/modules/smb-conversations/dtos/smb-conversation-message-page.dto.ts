import { Field, ObjectType } from '@nestjs/graphql';

import { SmbConversationMessageDTO } from 'src/modules/smb-conversations/dtos/smb-conversation-message.dto';

@ObjectType('SmbConversationMessagePage')
export class SmbConversationMessagePageDTO {
  @Field(() => [SmbConversationMessageDTO])
  messages: SmbConversationMessageDTO[];

  @Field(() => Boolean)
  hasMore: boolean;
}
