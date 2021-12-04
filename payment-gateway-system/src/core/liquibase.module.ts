import { Module } from '@nestjs/common';
import { ConfiguationModule } from './configuration.module';
import { LiquibaseService } from './service/liquibase.service';

@Module({
  imports: [ConfiguationModule],
  providers: [LiquibaseService],
})
export class LiquibaseModule {}
