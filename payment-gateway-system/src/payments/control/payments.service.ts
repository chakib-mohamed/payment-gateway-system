import { Injectable, Logger, NotAcceptableException, Redirect, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { UtilsService } from '../../core/service/utils.service';
import { Bank } from '../entity/bank';
import { CardType } from '../entity/card-type';
import { Client } from '../entity/client';
import { Payment } from '../entity/payment';
import { PaymentStatus } from '../entity/payment-status';
import { Pos } from '../entity/pos';
import { AuthorizationService } from './authorization.service';
import { CardValidatorService } from './card-validator.service';
import { ApiError } from './api-errors';
import { ThreeDSecureService } from './threeDSecure.service';
import { AuthenticationResponse, AuthorizationResponse } from './io-models';
import { ChallengResultRequestDto } from '../boundary/dto/challenge-result-request.dto';
import { Log } from '../../core/service/logger.decorator';
import { UserService } from '../../core/service/user.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Pos)
    private readonly posModel: typeof Pos,
    @InjectModel(Bank)
    private readonly bankModel: typeof Bank,
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
    private readonly utilsService: UtilsService,
    private readonly cardValidator: CardValidatorService,
    private readonly authorizationService: AuthorizationService,
    private readonly threeDSecureService: ThreeDSecureService,
    private readonly userService: UserService,
  ) {}

  @Log('Payments', 'Process Payment')
  async processPayment(payment: Payment): Promise<Payment | string> {
    this.validateCard(payment);

    const pos = await this.validatePos(payment);

    this.validateThatCardIsSupported(payment.cardNumber, pos.client.supportedCardTypes);

    this.validateAmount(pos.client.threshold, payment.amount);

    await this.initializeAndSavePayment(payment, pos);

    const issuingBank = await this.getIssuingBank(payment);
    payment.issuingBankId = issuingBank.id;

    // 3D Secure Authentication Req/Res
    const authenticationResponse = await this.init3DsecureAndUpdatePayment(payment, issuingBank);

    // if card number is enrolled in 3dSecure then redirect the client to URL else authorize
    if ([0, -1].includes(authenticationResponse.statusCode)) {
      if (authenticationResponse.isEnrolled) {
        return authenticationResponse.redirectURL + '/' + authenticationResponse.uuid;
      } else {
        await this.authorizeAndUpdatePayment(payment, issuingBank, pos.client);
      }
    }

    // TODO payment validation ?

    return payment;
  }

  private async getIssuingBank(payment: Payment): Promise<Bank> {
    const issuingBank = await this.bankModel.findOne({
      where: {
        bin: payment.rawCardNumber.substring(0, 6),
      },
    });

    if (issuingBank == null) {
      throw new NotAcceptableException(ApiError.ERR7);
    }
    return issuingBank;
  }

  private async init3DsecureAndUpdatePayment(payment: Payment, issuingBank: Bank): Promise<AuthenticationResponse> {
    let authenticationResponse: AuthenticationResponse;
    try {
      authenticationResponse = await this.threeDSecureService.authenticate(payment, issuingBank);
    } catch (err) {
      payment.status = PaymentStatus.THREEDS_AUTHENTICATION_ERROR;
      await payment.save();
      throw err;
    }

    payment.status = [0, -1].includes(authenticationResponse.statusCode)
      ? PaymentStatus.THREEDS_AUTHENTICATION_SUCCESSFUL
      : PaymentStatus.THREEDS_AUTHENTICATION_REJECTED;

    await payment.save();

    return authenticationResponse;
  }

  private async authorizeAndUpdatePayment(payment: Payment, issuingBank: Bank, client: Client) {
    let authorizationResponse: AuthorizationResponse;
    try {
      authorizationResponse = await this.authorizationService.authorize(payment, issuingBank, client);
    } catch (err) {
      payment.status = PaymentStatus.AUTHORIZATION_ERROR;
      await payment.save();
      throw err;
    }

    payment.status = [0, -1].includes(authorizationResponse.statusCode)
      ? PaymentStatus.AUTHORIZATION_SUCCESSFUL
      : PaymentStatus.AUTHORIZATION_REJECTED;

    await payment.save();
  }

  protected async initializeAndSavePayment(payment: Payment, pos: Pos): Promise<Payment> {
    payment.posId = pos.id;
    payment.rawCardNumber = payment.cardNumber;
    payment.cardNumber = await this.hash(payment.cardNumber);
    payment.status = PaymentStatus.INITIATED;
    return await payment.save();
  }

  private validateAmount(threshold: number, amount: number) {
    if (threshold != null && amount > threshold) {
      throw new NotAcceptableException(ApiError.ERR8);
    }
  }

  private validateCard(payment: Payment) {
    if (!this.cardValidator.isCardNumberValid(payment.cardNumber)) {
      throw new NotAcceptableException(ApiError.ERR4);
    }

    if (this.cardValidator.isCardExpired(payment.expirationDate)) {
      throw new NotAcceptableException(ApiError.ERR5);
    }
  }

  private validateThatCardIsSupported(cardNumber: string, supportedCardTypes: CardType[]): void {
    if (!this.cardValidator.isCardSupported(cardNumber, supportedCardTypes)) {
      throw new NotAcceptableException(ApiError.ERR7);
    }
  }

  @Log()
  private async validatePos(payment: Payment) {
    const { uuid } = payment.pos;

    if (!this.utilsService.isUUIDValid(uuid)) {
      throw new NotAcceptableException(ApiError.ERR3);
    }

    const pos = await this.lookupPos(uuid);

    if (pos == null) {
      throw new NotAcceptableException(ApiError.ERR3);
    }

    if (pos.client.clientId !== this.userService.getAuthenticatedUser().clientId) {
      throw new UnauthorizedException();
    }

    return pos;
  }

  private async lookupPos(uuid: string) {
    return await this.posModel.findOne({
      include: {
        model: Client,
        include: [CardType, Bank],
      },
      where: {
        uuid,
      },
    });
  }

  private async hash(text: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hashSync(text, salt);
  }

  async challengeResult(chanllengeResult: ChallengResultRequestDto) {
    const payment = await this.paymentModel.findOne({
      where: {
        uuid: chanllengeResult.uuid,
      },
      include: [Pos, Bank],
    });

    if (payment == null) {
      throw new NotAcceptableException(ApiError.ERR11);
    }

    payment.status = [0, -1].includes(chanllengeResult.statusCode)
      ? PaymentStatus.THREEDS_CHALLENGE_SUCCESSFUL
      : PaymentStatus.THREEDS_CHALLENGE_UNSUCCESSFUL;

    await payment.save();

    const pos = await this.lookupPos(payment.pos.uuid);

    await this.authorizeAndUpdatePayment(payment, payment.issuingBank, pos.client);
  }
}
