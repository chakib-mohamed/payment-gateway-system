import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';
import { CardTypeDto, CardTypeInputDto } from './card-type.dto';

@InputType()
export class ClientCreateRequestDto {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  address: string;

  @Field()
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  // @IsPositive()
  @Field((type) => Int, { nullable: true })
  threshold?: number;

  @Field()
  @IsNotEmpty()
  bankUuid: string;

  @Field()
  @IsNotEmpty()
  redirectURL: string;

  @Field((type) => [CardTypeInputDto])
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => CardTypeInputDto)
  supportedCardTypes: CardTypeInputDto[];
}
