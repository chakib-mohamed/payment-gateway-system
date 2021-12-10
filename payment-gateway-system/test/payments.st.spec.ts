import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import path from 'path';
import request from 'supertest';
import { DockerComposeEnvironment } from 'testcontainers';
import { v4 as uuid4 } from 'uuid';
import { AuthInternalGuard } from '../src/core/service/auth-internal.guard';
import { AuthMerchantsGuard } from '../src/core/service/auth-merchants.guard';
import { AuthenticatedUser } from '../src/core/service/user.service';
import { ChallengResultRequestDto } from '../src/payments/boundary/dto/challenge-result-request.dto';
import { ClientDto } from '../src/payments/boundary/dto/client.dto';
import { PosDto } from '../src/payments/boundary/dto/pos.dto';
import { HttpExceptionFilter } from '../src/payments/boundary/http-exception.filter';
import { PaymentService } from '../src/payments/control/payments.service';
import { Bank } from '../src/payments/entity/bank';
import { CardType } from '../src/payments/entity/card-type';
import { Payment } from '../src/payments/entity/payment';
import { Pos } from '../src/payments/entity/pos';
import { PaymentsModule } from '../src/payments/payments.module';

jest.setTimeout(100000);

let app: INestApplication;
let createdBank: Bank;
let supportedCards: CardType[];
let createdPayment: Payment;
// let merchantAccessToken: string;

// class MockAuthorizationService extends AuthorizationService {
//   async authorize(payment: Payment, issuingBank: Bank, client: Client): Promise<AuthorizationResponse> {
//     return new Promise((resolve) => {
//       resolve({
//         uuid: '',
//         status: 'SUCCESS',
//         message: 'Authorization successful',
//         statusCode: 0,
//       });
//     });
//   }
// }

class MockAuthInternalGuard extends AuthGuard('internal') {
  canActivate(context: ExecutionContext): boolean {
    const authUser: AuthenticatedUser = {
      realm_access: { roles: ['admin'] },
    };
    const req = context.switchToHttp().getRequest();
    req.user = authUser;

    return true;
  }
}

class MockAuthMerchantsGuard extends AuthGuard('merchants') {
  canActivate(context: ExecutionContext): boolean {
    const authUser: AuthenticatedUser = {
      clientId: 'merchant-1',
    };
    const req = context.switchToHttp().getRequest();
    req.user = authUser;

    return true;
  }
}

// class Mock3DSService extends ThreeDSecureService {
//   async authenticate(payment: Payment, issuingBank: Bank): Promise<AuthenticationResponse> {
//     return new Promise((resolve) => {
//       resolve({
//         uuid: '',
//         status: 'SUCCESS',
//         message: 'Authentication successful',
//         statusCode: 0,
//         isEnrolled: true,
//         redirectURL: 'http://localhost:3001/validate-otp',
//       });
//     });
//   }
// }

class MockPaymentService extends PaymentService {
  protected async initializeAndSavePayment(payment: Payment, pos: Pos) {
    createdPayment = await super.initializeAndSavePayment(payment, pos);
    return createdPayment;
  }
}

let environment;
beforeAll(async () => {
  // Start a postgres and issuing-bank containers
  const composeFilePath = path.resolve(__dirname, '../../deployments/docker');
  const composeFile = 'docker-compose.yml';

  environment = await new DockerComposeEnvironment(composeFilePath, composeFile).up(['postgres', 'issuing-bank']);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [PaymentsModule],
  })
    // .overrideProvider(AuthorizationService)
    // .useClass(MockAuthorizationService)
    // .overrideProvider(ThreeDSecureService)
    // .useClass(Mock3DSService)
    .overrideGuard(AuthMerchantsGuard)
    .useClass(MockAuthMerchantsGuard)
    .overrideGuard(AuthInternalGuard)
    .useClass(MockAuthInternalGuard)
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

afterAll(async () => {
  environment && (await environment.down());
});

// const getMerchantAccessToken = async () => {
// const bodyFormData = new URLSearchParams();
// bodyFormData.append('client_id', 'merchant-1');
// bodyFormData.append('client_secret', '490a6d1c-5caa-418d-adc5-aa4f8888aa05');
// bodyFormData.append('grant_type', 'client_credentials');
// return httpService
//   .post<any>('http://localhost:8181/auth/realms/payment-gs-merchants/protocol/openid-connect/token', bodyFormData, {
//     headers: { 'content-type': 'application/x-www-form-urlencoded' },
//   })
//   .toPromise()
//   .then((resp) => resp.data.access_token);
// };

describe('Clients Controller (e2e)', () => {
  it(`(GET /clients/1111111) : Should return 406 because the given uuid is invalid`, () => {
    return request(app.getHttpServer()).get('/clients/1111111').expect(406);
  });

  const uuid = uuid4();
  it('(GET /clients/' + uuid + ') : Should return 404 because the given uuid dosnt correpond to any Client', () => {
    return request(app.getHttpServer()).get(`/clients/${uuid}`).expect(404);
  });

  it('(POST /clients/) : Should return 400 because some of required attributes are missing in the payload', () => {
    return request(app.getHttpServer())
      .post('/clients')
      .send(getClientMockWithMissingProp())

      .expect(400);
  });

  it('(POST /clients/) : Should return 406 because bank uuid format is incorrect', () => {
    return request(app.getHttpServer())
      .post('/clients')
      .send(getClientMockWithInvalidBankUuidFormat())

      .expect(406);
  });

  it('(POST /clients/) : Should return 406 because bank uuid is incorrect', () => {
    return request(app.getHttpServer())
      .post('/clients')
      .send(getClientMockWithInvalidBankUuid())

      .expect(406);
  });

  it('(POST /clients/) : Should return 406 because supported card type uuid format is incorrect', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithInvalidCardTypeUuidFormat()).expect(406);
  });

  it('(POST /clients/) : Should return 406 because supported card type uuid is incorrect', () => {
    return request(app.getHttpServer()).post('/clients').send(getClientMockWithInvalidCardTypeUuid()).expect(406);
  });

  it('(POST /clients/) : Should return 201', async () => {
    const res: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 1'));
    expect(res.status).toBe(201);
    expect(res.body.name).toEqual('Client 1');
  });

  it('(PUT /clients/) : Should return 200', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 2'));
    expect(response.status).toBe(201);

    const createdClient = response.body as ClientDto;
    const res: request.Response = await request(app.getHttpServer())
      .put('/clients')
      .send({ uuid: createdClient.uuid, ...getCreateClientMock('Client 2 Update') });
    expect(res.status).toBe(200);
    expect(res.body.name).toEqual('Client 2 Update');
  });
});

describe('Pos Controller (e2e)', () => {
  it('(POST /pos/) : Should return 400 because some of required attributes are missing in the payload', () => {
    return request(app.getHttpServer())
      .post('/pos')
      .send(getPosMockWithMissingProp())

      .expect(400);
  });

  it('(POST /pos/) : Should return 406 because client uuid format is incorrect', () => {
    return request(app.getHttpServer())
      .post('/pos')
      .send(getPosMockWithInvalidClientUuidFormat())

      .expect(406);
  });

  it('(POST /pos/) : Should return 406 because client uuid is incorrect', () => {
    return request(app.getHttpServer())
      .post('/pos')
      .send(getPosMockWithInvalidClientUuid())

      .expect(406);
  });

  it('(POST /pos/) : Should return 201', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 3'));
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock(createdClient.uuid));
    expect(res.status).toBe(201);
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
    return request(app.getHttpServer())
      .post('/payments')
      .send(getPaymentMockWithInvalidCardNumberLength('dummyPosUuid'))
      .expect(406);
  });

  it('(POST /payments/) : Should return 406 because card number format is invalid', () => {
    return request(app.getHttpServer())
      .post('/payments')
      .send(getPaymentMockWithInvalidCardNumber('dummyPosUuid'))

      .expect(406);
  });

  it('(POST /payments/) : Should return 406 because card number date is expired', () => {
    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithExpiredCardNumber('dummyPosUuid')).expect(406);
  });

  it('(POST /payments/) : Should return 406 because this corresponding pos do not support the given card number type', async () => {
    const response: request.Response = await request(app.getHttpServer())
      .post('/clients')
      .send(getCreateClientMockWithInsupportedCardType());
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock(createdClient.uuid));
    expect(res.status).toBe(201);
    const createdPos = response.body as ClientDto;

    return request(app.getHttpServer())
      .post('/payments')
      .send(getPaymentMockWithUnsupportedCardType(createdPos.uuid))
      .expect(406);
  });

  it('(POST /payments/) : Should return 406 because the permited amount is succeeded', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 5'));
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock(createdClient.uuid));
    expect(res.status).toBe(201);
    const createdPos = response.body as ClientDto;

    return request(app.getHttpServer()).post('/payments').send(getPaymentMockWithSucceededAmount(createdPos.uuid)).expect(406);
  });

  it('(POST /payments/) : Should return 406 because the card number bin do not to any registed bank', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 6'));
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock(createdClient.uuid));
    expect(res.status).toBe(201);
    const createdPos = response.body as ClientDto;

    return request(app.getHttpServer())
      .post('/payments')
      .send(getPaymentMockWithInvalidCardNumberBIN(createdPos.uuid))
      .expect(406);
  });

  it('(POST /payments/) : Should return a 302 redirection', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 7'));
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const res: request.Response = await request(app.getHttpServer()).post('/pos').send(getCreatePosMock(createdClient.uuid));
    expect(res.status).toBe(201);
    const createdPos = res.body as PosDto;

    return request(app.getHttpServer()).post('/payments').send(getProcessPaymentMock(createdPos.uuid)).expect(302);
  });

  it('(POST /result/) : Should return a 406 because the payment uuid is not valid', async () => {
    const res: request.Response = await request(app.getHttpServer())
      .post('/result')
      .send(getAuthResultRequestMockWithInvalidUuid());
    expect(res.status).toBe(406);
  });

  it('(POST /result/) : Should return a 200', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 8'));
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const posResponse: request.Response = await request(app.getHttpServer())
      .post('/pos')
      .send(getCreatePosMock(createdClient.uuid));
    expect(posResponse.status).toBe(201);
    const createdPos = posResponse.body as PosDto;

    await request(app.getHttpServer()).post('/payments').send(getProcessPaymentMock(createdPos.uuid)).expect(302);

    const res: request.Response = await request(app.getHttpServer()).post('/result').send(getAuthResultRequestMock());
    expect(res.status).toBe(201);
  });

  it('(GET /redirect/:uuid) : Should return a 302 with the registred client redirect url', async () => {
    const response: request.Response = await request(app.getHttpServer()).post('/clients').send(getCreateClientMock('Client 9'));
    expect(response.status).toBe(201);
    const createdClient = response.body as ClientDto;

    const posResponse: request.Response = await request(app.getHttpServer())
      .post('/pos')
      .send(getCreatePosMock(createdClient.uuid));
    expect(posResponse.status).toBe(201);
    const createdPos = posResponse.body as PosDto;

    await request(app.getHttpServer()).post('/payments').send(getProcessPaymentMock(createdPos.uuid)).expect(302);
    return request(app.getHttpServer())
      .get('/redirect/' + createdPayment.uuid)
      .send()
      .expect(302);
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

function getPaymentMockWithInvalidCardNumberLength(posUuid): any {
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158993',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidCardNumber(posUuid): any {
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632151',
    verificationCode: 123,
    expirationDate: '11/22',
    posUuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithExpiredCardNumber(posUuid): any {
  const expireddate = '01/' + (new Date().getFullYear() - 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expireddate,
    posUuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithUnsupportedCardType(posUuid): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithSucceededAmount(posUuid): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 10000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getPaymentMockWithInvalidCardNumberBIN(posUuid): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4929819888632158',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid,
  };
  return JSON.parse(JSON.stringify(payment));
}

function getProcessPaymentMock(posUuid): any {
  const expirationDate = '01/' + (new Date().getFullYear() + 1).toString().substr(2, 2);
  const payment = {
    amount: 1000,
    cardNumber: '4024007188053960',
    verificationCode: 123,
    expirationDate: expirationDate,
    posUuid,
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
    redirectURL: 'http://localhost:4200/redirect',
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
    redirectURL: 'http://localhost:4200/redirect',
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
    redirectURL: 'http://localhost:4200/redirect',
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
    redirectURL: 'http://localhost:4200/redirect',
    supportedCardTypes: [{ uuid: 'd09c1434-65b6-4720-a99d-05104b71737a' }],
  };
  return JSON.parse(JSON.stringify(client));
}

function getCreateClientMock(name: string): any {
  const client = {
    name,
    address: 'Address ' + name,
    threshold: 2000,
    isActive: true,
    bankUuid: createdBank.uuid,
    clientId: 'merchant-1',
    redirectURL: 'http://localhost:4200/redirect',
    supportedCardTypes: [{ uuid: supportedCards[0].uuid }, { uuid: supportedCards[1].uuid }],
  };

  return JSON.parse(JSON.stringify(client));
}

function getCreateClientMockWithInsupportedCardType(): any {
  const client = {
    name: 'Client 4',
    address: 'Address Client 4',
    isActive: true,
    bankUuid: createdBank.uuid,
    clientId: 'merchant-1',
    redirectURL: 'http://localhost:4200/redirect',
    supportedCardTypes: [{ uuid: supportedCards[2].uuid }],
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

function getCreatePosMock(clientUuid: string): any {
  const pos = {
    isActive: true,
    clientUuid,
  };
  return JSON.parse(JSON.stringify(pos));
}
