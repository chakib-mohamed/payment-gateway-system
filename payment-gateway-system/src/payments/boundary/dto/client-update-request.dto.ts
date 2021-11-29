import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';
import { ClientCreateRequestDto } from './client-create-request.dto';

@InputType()
export class ClientUpdateRequestDto extends ClientCreateRequestDto {
  @Field()
  @IsNotEmpty()
  uuid: string;
}
