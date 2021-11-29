import { IsNotEmpty, IsNumber } from 'class-validator';
import { IsValidExpirationDate } from '../validators/expiration-date.validator';

export class PaymentRequestDto {
  @IsNotEmpty()
  posUuid: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  cardNumber: string;

  @IsNotEmpty()
  @IsValidExpirationDate({ message: 'Card Expiration Date must be as MM/yy' })
  expirationDate: string;

  @IsNotEmpty()
  @IsNumber()
  verificationCode: number;
}
