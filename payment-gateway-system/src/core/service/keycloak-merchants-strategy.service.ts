import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import KeycloakBearerStrategy from 'passport-keycloak-bearer';

@Injectable()
export class KeycloakMerchantsStrategy extends PassportStrategy(KeycloakBearerStrategy, 'merchants') {
  constructor(private readonly configService: ConfigService) {
    super({
      realm: configService.get<string>('KEYCLOAK_REALM_MERCHANTS'),
      url: configService.get<string>('KEYCLOAK_URL'),
    });
  }

  async validate(jwtPayload: any): Promise<any> {
    return jwtPayload;
  }
}
