import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfiguationModule } from './configuration.module';
import { AuthInternalGuard } from './service/auth-internal.guard';
import { AuthMerchantsGuard } from './service/auth-merchants.guard';
import { KeycloakInternalStrategy } from './service/keycloak-internal-strategy.service';
import { KeycloakMerchantsStrategy } from './service/keycloak-merchants-strategy.service';
import { RolesGuard } from './service/roles.guard';
import { UserService } from './service/user.service';

@Module({
  imports: [ConfiguationModule, PassportModule],
  providers: [
    AuthMerchantsGuard,
    AuthInternalGuard,
    RolesGuard,
    KeycloakMerchantsStrategy,
    KeycloakInternalStrategy,
    UserService,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
  ],
  exports: [KeycloakMerchantsStrategy, KeycloakInternalStrategy, UserService],
})
export class AuthModule {}
