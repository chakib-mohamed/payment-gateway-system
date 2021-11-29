import { Field, ObjectType } from '@nestjs/graphql';
import { PaymentStatus } from '../../entity/payment-status';

@ObjectType()
export class PaymentResponseDto {
  @Field()
  uuid?: string;

  @Field()
  status: PaymentStatus;
}
