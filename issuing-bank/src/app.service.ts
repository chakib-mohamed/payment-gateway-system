import { HttpException, HttpService, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Authentication,
  AuthenticationRequest,
  AuthenticationResponse,
  AuthorizationRequest,
  AuthorizationResponse,
  ChallengResultRequestDto,
} from './models';

@Injectable()
export class AppService {
  // <uuid, Authentication]
  inMemDB = new Map<string, Authentication>();

  private readonly logger = new Logger(AppService.name);

  constructor(private readonly httpService: HttpService) {}

  authorize(authRequest: AuthorizationRequest): AuthorizationResponse {
    return {
      uuid: uuidv4(),
      status: 'SUCCESS',
      message: 'Authorization successful',
      statusCode: 0,
    };
  }

  authenticate(authReq: AuthenticationRequest): [AuthenticationResponse, string] {
    const otp = this.generateOTP();
    const uuid = uuidv4();
    this.logger.log(`Generated OTP for uuid : ${uuid} , is : ${otp}`);

    const authRes: AuthenticationResponse = {
      uuid,
      status: 'SUCCESS',
      message: 'Authentication successful',
      statusCode: 0,
      isEnrolled: true,
      redirectURL: 'http://localhost:3001/validate-otp', //todo Dynamic
    };

    this.inMemDB.set(uuid, { authReq, authRes, otp, generatedAt: new Date() });

    return [authRes, otp];
  }

  private generateOTP(): string {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }

  async validateOTP(uuid: string, otp: string): Promise<string> {
    if (!this.inMemDB.has(uuid)) {
      throw new HttpException('Invalid UUid', 406);
    }

    const authentication = this.inMemDB.get(uuid);

    // 2 min timeout
    if (authentication.generatedAt.getMilliseconds() + 1000 * 60 * 2 < new Date().getMilliseconds()) {
      throw new HttpException('Timeout', 406);
    }

    if (authentication.otp != otp) {
      throw new HttpException('Otps mismatch', 406);
    }

    authentication.isValidated = true;

    this.inMemDB.set(uuid, authentication);

    const payload: ChallengResultRequestDto = {
      uuid: authentication.authReq.uuid,
      message: 'success',
      status: 'SUCCESS',
      statusCode: 0,
    };

    await this.httpService
      .post<any>(authentication.authReq.challengeResultURL, payload)
      .toPromise()
      .then((resp) => resp.data);

    return authentication.authReq.redirectURL;
  }
}
