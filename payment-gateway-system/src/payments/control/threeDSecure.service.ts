import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Bank } from '../entity/bank';
import { Payment } from '../entity/payment';
import { AuthenticationRequest, AuthenticationResponse } from './io-models';

@Injectable()
export class ThreeDSecureService {
  constructor(private httpService: HttpService) {}

  async authenticate(payment: Payment, issuingBank: Bank): Promise<AuthenticationResponse> {
    const payload: AuthenticationRequest = {
      uuid: payment.uuid,
      pan: +payment.rawCardNumber,
      expirationDate: payment.expirationDate,
      amount: payment.amount,
      verificationCode: payment.verificationCode,
      challengeResultURL: 'http://localhost:3000/result', //TODO dynamic
      redirectURL: 'http://localhost:3000/redirect',
    };

    return this.httpService
      .post<AuthenticationResponse>(issuingBank.AReqURL, payload)
      .toPromise()
      .then((resp) => resp.data);
  }
}
