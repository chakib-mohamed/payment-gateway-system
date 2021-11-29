import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CardTypeDto } from './card-type.dto';

@ObjectType()
export class ClientDto {
  @Field()
  uuid: string;

  @Field()
  name: string;

  @Field()
  address: string;

  @Field()
  isActive: boolean;

  @Field((type) => Int)
  threshold?: number;

  @Field()
  redirectURL: string;

  @Field((type) => [CardTypeDto])
  supportedCardTypes: CardTypeDto[];
}
