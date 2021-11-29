import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@ObjectType()
export class CardTypeDto {
  @Field()
  @IsNotEmpty()
  uuid: string;
}

@InputType()
export class CardTypeInputDto {
  @Field()
  @IsNotEmpty()
  uuid: string;
}
