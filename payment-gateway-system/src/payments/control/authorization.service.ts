import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Bank } from '../entity/bank';
import { Client } from '../entity/client';
import { Payment } from '../entity/payment';
import { AuthorizationResponse } from './io-models';

@Injectable()
export class AuthorizationService {
  constructor(private httpService: HttpService) {}

  async authorize(payment: Payment, issuingBank: Bank, client: Client): Promise<AuthorizationResponse> {
    const payload = {
      debitPan: payment.rawCardNumber,
      creditPAN: client.pan,
      expirationDate: payment.expirationDate,
      amount: payment.amount,
      verificationCode: payment.verificationCode,
    };

    return this.httpService
      .post<AuthorizationResponse>(issuingBank.authorizationURL, payload)
      .toPromise()
      .then((resp) => resp.data);
  }
}
