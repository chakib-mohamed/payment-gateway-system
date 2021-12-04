import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth.module';
import { ConfiguationModule } from './configuration.module';
import { DatabaseModule } from './database.module';
import { LiquibaseModule } from './liquibase.module';
import { UtilsService } from './service/utils.service';

@Module({
  imports: [
    ConfiguationModule,
    DatabaseModule,
    LiquibaseModule,
    AuthModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('THROTTLE_TTL'),
        limit: config.get('THROTTLE_LIMIT'),
      }),
    }),
  ],
  exports: [ConfiguationModule, DatabaseModule, AuthModule, UtilsService],
  providers: [UtilsService],
})
export class CoreModule {}
