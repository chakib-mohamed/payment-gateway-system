import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { v4 as uuid4 } from 'uuid';
import { ChallengResultRequestDto } from '../src/payments/boundary/dto/challenge-result-request.dto';
import { ClientDto } from '../src/payments/boundary/dto/client.dto';
import { PosDto } from '../src/payments/boundary/dto/pos.dto';
import { HttpExceptionFilter } from '../src/payments/boundary/http-exception.filter';
import { AuthorizationService } from '../src/payments/control/authorization.service';
import { AuthenticationResponse, AuthorizationResponse } from '../src/payments/control/io-models';
import { PaymentService } from '../src/payments/control/payments.service';
import { ThreeDSecureService } from '../src/payments/control/threeDSecure.service';
import { Bank } from '../src/payments/entity/bank';
import { CardType } from '../src/payments/entity/card-type';
import { Client } from '../src/payments/entity/client';
import { Payment } from '../src/payments/entity/payment';
import { Pos } from '../src/payments/entity/pos';
import { PaymentsModule } from '../src/payments/payments.module';

jest.setTimeout(100000);

let app: INestApplication;
let createdBank: Bank;
let supportedCards: CardType[];
let createdClient: ClientDto;
let createdPos: PosDto;
let createdClient2: ClientDto;
let createdPos2: PosDto;
let createdPayment: Payment;

class MockAuthorizationService extends AuthorizationService {
  async authorize(payment: Payment, issuingBank: Bank, client: Client): Promise<AuthorizationResponse> {
    return new Promise((resolve) => {
      resolve({
        uuid: '',
        status: 'SUCCESS',
        message: 'Authorization successful',
        statusCode: 0,
      });
    });
  }
}

class Mock3DSService extends ThreeDSecureService {
  async authenticate(payment: Payment, issuingBank: Bank): Promise<AuthenticationResponse> {
    return new Promise((resolve) => {
      resolve({
        uuid: '',
        status: 'SUCCESS',
        message: 'Authentication successful',
        statusCode: 0,
        isEnrolled: true,
        redirectURL: 'http://localhost:3001/validate-otp',
      });
    });
  }
}

class MockPaymentService extends PaymentService {
  protected async initializeAndSavePayment(payment: Payment, pos: Pos) {
    createdPayment = await super.initializeAndSavePayment(payment, pos);
    return createdPayment;
  }
}

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [PaymentsModule],
  })
    // .overrideProvider(AuthorizationService)
    // .useClass(MockAuthorizationService)
    // .overrideProvider(ThreeDSecureService)
    // .useClass(Mock3DSService)
    .overrideProvider(PaymentService)
    .useClass(MockPaymentService)
    .compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapter));
  await app.init();

  // Get test data
  createdBank = await Bank.findAll({ limit: 1 }).then((banks) => banks[0]);
  supportedCards = await CardType.findAll();
});

describe('Clients Controller (e2e)', () => {
  it(`(GET /clients/1111111) : Should return 406 because the given uuid is invalid`, () => {
    return request(app.getHttpServer()).get('/clients/1111111').expect(406);
  });

  const uuid = uuid4();
  it('(GET /clients/' + uuid + ') : Should return 404 because the given uuid dosnt correpond to any Client', () => {
    return request(app.getHttpServer()).get(`/clients/${uuid}`).expect(404);
  });

  it('(POST /clients/) : Should return 400 because some of required attributes are missing in the payload', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithMissingProp()).expect(400);
  });

  it('(POST /clients/) : Should return 406 because bank uuid format is incorrect', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithInvalidBankUuidFormat()).expect(406);
  });

  it('(POST /clients/) : Should return 406 because bank uuid is incorrect', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithInvalidBankUuid()).expect(406);
  });

  it('(POST /clients/) : Should return 406 because supported card type uuid format is incorrect', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithInvalidCardTypeUuidFormat()).expect(406);
  });

  it('(POST /clients/) : Should return 406 because supported card type uuid is incorrect', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithInvalidCardTypeUuid()).expect(406);
  });

  it('(POST /clients/) : Should return 201', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock());
    expect(res.status).toBe(201);
    expect(res.body.name).toEqual('Client 1');

    createdClient = res.body as ClientDto;
  });

  it('(POST /clients/) : Should return 201', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock2());
    expect(res.status).toBe(201);
    // Used to test payment processing
    createdClient2 = res.body as ClientDto;
  });

  it('(PUT /clients/) : Should return 200', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .put('/clients')
      .send(getUpdateClientMock(createdClient.uuid));
    expect(res.status).toBe(200);
    expect(res.body.name).toEqual('Client 2');
  });
});

describe('Pos Controller (e2e)', () => {
  it('(POST /pos/) : Should return 400 because some of required attributes are missing in the payload', () => {
    return request(app.getHttpServer()).post('/pos').send(getPosMockWithMissingProp()).expect(400);
  });

  it('(POST /pos/) : Should return 406 because client uuid format is incorrect', () => {
    return request(app.getHttpServer()).post('/pos').send(getPosMockWithInvalidClientUuidFormat()).expect(406);
  });

  it('(POST /pos/) : Should return 406 because client uuid is incorrect', () => {
    return request(app.getHttpServer()).post('/pos').send(getPosMockWithInvalidClientUuid()).expect(406);
  });

  it('(POST /pos/) : Should return 201', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock());
    expect(res.status).toBe(201);
    createdPos = res.body;
  });

  it('(POST /pos/) : Should return 201', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock2());
    expect(res.status).toBe(201);
    createdPos2 = res.body;
  });
});

describe('Payments Controller (e2e)', () => {
  it('(POST /payments/) : Should return 400 because some of required attributes are missing in the payload', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithMissingProp()).expect(400);
  });

  it('(POST /payments/) : Should return 400 because expiration date is invalid in the payload', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithInvalidExpirationDateFormat()).expect(400);
  });

  it('(POST /payments/) : Should return 400 because pos uuid format is invalid', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithInvalidPosUuidFormat()).expect(400);
  });

  it('(POST /payments/) : Should return 400 because pos uuid is invalid', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithInvalidPosUuid()).expect(400);
  });

  it('(POST /payments/) : Should return 406 because card number length is invalid', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithInvalidCardNumberLength()).expect(406);
  });

  it('(POST /payments/) : Should return 406 because card number format is invalid', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithInvalidCardNumber()).expect(406);
  });

  it('(POST /payments/) : Should return 406 because card number date is expired', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithExpiredCardNumber()).expect(406);
  });

  it('(POST /payments/) : Should return 406 because this corresponding pos do not support the given card number type', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithUnsupportedCardType()).expect(406);
  });

  it('(POST /payments/) : Should return 406 because the permited amount is succeeded', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithSucceededAmount()).expect(406);
  });

  it('(POST /payments/) : Should return 406 because the card number bin do not to any registed bank', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithInvalidCardNumberBIN()).expect(406);
  });

  it('(POST /payments/) : Should return a 302 redirection', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/payments').send(getProcessPaymentMock());
    expect(res.status).toBe(302);
  });

  it('(POST /result/) : Should return a 406 because the payment uuid is not valid', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .post('/result')
      .send(getAuthResultRequestMockWithInvalidUuid());
    expect(res.status).toBe(406);
  });

  it('(POST /result/) : Should return a 200', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/result').send(getAuthResultRequestMock());
    expect(res.status).toBe(201);
  });

  it('(GET /redirect/:uuid) : Should return a 302 with the registred client redirect url', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .get('/redirect/' + createdPayment.uuid)
      .send(getProcessPaymentMock());
    expect(res.status).toBe(302);
    // expect(res.)
  });
});

function getPaymentMockWithMissingProp(): any {
  const payment = {
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid: '75961d5d-4ca2-48ac-9304-5edb42674ec6',
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidExpirationDateFormat(): any {
  const payment = {
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: '11/232',
    posUuid: '75961d5d-4ca2-48ac-9304-5edb42674ec6',
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidPosUuidFormat(): any {
  const payment = {
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid: '1111111111',
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidPosUuid(): any {
  const payment = {
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid: '75961d5d-4ca2-48ac-9304-5edb42674ec6',
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidCardNumberLength(): any {
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158993',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid: createdPos.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidCardNumber(): any {
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632151',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid: createdPos.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithExpiredCardNumber(): any {
  const expireddate = '01/' + (new Date().getFullYear() - 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expireddate,
    posUuid: createdPos.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithUnsupportedCardType(): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid: createdPos2.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithSucceededAmount(): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 10000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid: createdPos.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidCardNumberBIN(): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid: createdPos.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getProcessPaymentMock(): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4024007188053960',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid: createdPos.uuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getAuthResultRequestMockWithInvalidUuid(): any {
  const payload: ChallengResultRequestDto = {
    uuid: uuid4(),
    message: 'success',
    status: 'SUCCESS',
    statusCode: 0,
  };
  return JSON.parse(JSON.stringify(payload));
}

function getAuthResultRequestMock(): any {
  const payload: ChallengResultRequestDto = {
    uuid: createdPayment.uuid,
    message: 'success',
    status: 'SUCCESS',
    statusCode: 0,
  };
  return JSON.parse(JSON.stringify(payload));
}

function getClientMockWithMissingProp(): any {
  const client = {
    address: 'Address Client 1',
    isActive: true,
    bankUuid: 'd09c1434-65b6-4720-a99d-05104b71737a',
    supportedCardTypes: [{ uuid: 'd09c1434-65b6-4720-a99d-05104b71737a' }, { uuid: '65c0fd08-7a5f-4f1a-951c-9bde24c02f18' }],
  };
  return JSON.parse(JSON.stringify(client));
}

function getClientMockWithInvalidBankUuidFormat(): any {
  const client = {
    name: 'Client 1',
    address: 'Address Client 1',
    isActive: true,
    bankUuid: '11111111111',
    supportedCardTypes: [{ uuid: 'd09c1434-65b6-4720-a99d-05104b71737a' }],
  };
  return JSON.parse(JSON.stringify(client));
}

function getClientMockWithInvalidBankUuid(): any {
  const client = {
    name: 'Client 1',
    address: 'Address Client 1',
    isActive: true,
    bankUuid: 'd09c1434-65b6-4720-a99d-05104b71737a',
    supportedCardTypes: [{ uuid: 'd09c1434-65b6-4720-a99d-05104b71737a' }],
  };
  return JSON.parse(JSON.stringify(client));
}

function getClientMockWithInvalidCardTypeUuidFormat(): any {
  const client = {
    name: 'Client 1',
    address: 'Address Client 1',
    isActive: true,
    bankUuid: createdBank.uuid,
    supportedCardTypes: [{ uuid: '111111111111111' }],
  };
  return JSON.parse(JSON.stringify(client));
}

function getClientMockWithInvalidCardTypeUuid(): any {
  const client = {
    name: 'Client 1',
    address: 'Address Client 1',
    isActive: true,
    bankUuid: createdBank.uuid,
    supportedCardTypes: [{ uuid: 'd09c1434-65b6-4720-a99d-05104b71737a' }],
  };
  return JSON.parse(JSON.stringify(client));
}

function getCreateClientMock(): any {
  const client = {
    name: 'Client 1',
    address: 'Address Client 1',
    threshold: 2000,
    isActive: true,
    redirectURL: 'http://test/redirect',
    bankUuid: createdBank.uuid,
    supportedCardTypes: [{ uuid: supportedCards[0].uuid }, { uuid: supportedCards[1].uuid }],
  };

  return JSON.parse(JSON.stringify(client));
}

function getCreateClientMock2(): any {
  const client = {
    name: 'Client 3',
    address: 'Address Client 3',
    isActive: true,
    bankUuid: createdBank.uuid,
    supportedCardTypes: [{ uuid: supportedCards[2].uuid }],
  };

  return JSON.parse(JSON.stringify(client));
}

function getUpdateClientMock(uuid: string): any {
  const client = {
    uuid,
    name: 'Client 2',
    address: 'Address Client 1',
    isActive: true,
    bankUuid: createdBank.uuid,
    supportedCardTypes: [{ uuid: supportedCards[0].uuid }, { uuid: supportedCards[1].uuid }],
  };

  return JSON.parse(JSON.stringify(client));
}

function getPosMockWithMissingProp(): any {
  const pos = {
    isActive: true,
  };
  return JSON.parse(JSON.stringify(pos));
}

function getPosMockWithInvalidClientUuidFormat(): any {
  const pos = {
    isActive: true,
    clientUuid: 'd09c1434-65b6-4720-a99d-05104b71737a',
  };
  return JSON.parse(JSON.stringify(pos));
}

function getPosMockWithInvalidClientUuid(): any {
  const pos = {
    isActive: true,
    clientUuid: 'd09c1434-65b6-4720-a99d-05104b71737a',
  };
  return JSON.parse(JSON.stringify(pos));
}

function getCreatePosMock(): any {
  const pos = {
    isActive: true,
    clientUuid: createdClient.uuid,
  };
  return JSON.parse(JSON.stringify(pos));
}

function getCreatePosMock2(): any {
  const pos = {
    isActive: true,
    clientUuid: createdClient2.uuid,
  };
  return JSON.parse(JSON.stringify(pos));
}
