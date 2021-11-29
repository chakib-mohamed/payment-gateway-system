import { UseGuards } from '@nestjs/common';
import { Resolver, Subscription } from '@nestjs/graphql';
import { AuthInternalGuard } from '../../core/service/auth-internal.guard';
import { Roles, RolesGuard } from '../../core/service/roles.guard';
import { PAYMENT_EVENT, pubSub } from '../entity/payment';
import { PaymentResponseDto } from './dto/payment-reponse.dto';
import { PaymentsMapperService } from './mappers/payments-mapper.service';

@Resolver('Payment')
@UseGuards(AuthInternalGuard)
export class PaymentsResolver {
  constructor(private paymentMapperService: PaymentsMapperService) {}

  @Subscription((returns) => PaymentResponseDto, {
    name: 'paymentChangeListener',
    resolve(this: PaymentsResolver, value) {
      return this.paymentMapperService.mapToDto(value);
    },
  })
  @UseGuards(RolesGuard)
  @Roles('admin')
  async paymentChangeListener() {
    return pubSub.asyncIterator(PAYMENT_EVENT);
  }
}
