import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UtilsService } from '../../../core/service/utils.service';
import { Payment } from '../../entity/payment';
import { Pos } from '../../entity/pos';
import { PaymentResponseDto } from '../dto/payment-reponse.dto';
import { PaymentRequestDto } from '../dto/payment-request.dto';

@Injectable()
export class PaymentsMapperService {
  private readonly logger = new Logger(PaymentsMapperService.name);

  constructor(
    private readonly utilsService: UtilsService,
    @InjectModel(Pos)
    private readonly posModel: typeof Pos,
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
  ) {}

  async mapToEntity(paymentDto: PaymentRequestDto): Promise<Payment> {
    const payment = this.paymentModel.build({ ...paymentDto });
    const pos = this.posModel.build({ uuid: paymentDto.posUuid });

    payment.pos = pos;

    payment.rawExpirationDate = paymentDto.expirationDate;
    payment.expirationDate = this.utilsService.getDateFromCardExpirationDate(paymentDto.expirationDate);

    return payment;
  }

  mapToDto(payment: Payment): PaymentResponseDto {
    const { uuid, status } = payment;

    const paymentDto: PaymentResponseDto = {
      uuid,
      status,
    };
    return paymentDto;
  }
}
