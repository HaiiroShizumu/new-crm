import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('SmbBitrixCrmLink')
export class SmbBitrixCrmLinkDTO {
  @Field(() => String)
  url: string;
}
