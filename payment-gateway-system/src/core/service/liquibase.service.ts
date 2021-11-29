import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Liquibase, LiquibaseConfig, POSTGRESQL_DEFAULT_CONFIG } from 'liquibase';

@Injectable()
export class LiquibaseService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const myConfig: LiquibaseConfig = {
      ...POSTGRESQL_DEFAULT_CONFIG,
      url: `jdbc:postgresql://${this.configService.get('DATABASE_HOST')}:${this.configService.get(
        'DATABASE_PORT',
      )}/${this.configService.get('DATABASE_NAME')}`,
      username: this.configService.get('DATABASE_USERNAME'),
      password: this.configService.get('DATABASE_PASSWORD'),
      changeLogFile: './changelog.xml',
      // classpath: this.configService.get('LIQUIBASE_DRIVER_CLASSPATH')
    };
    const instance = new Liquibase(myConfig);

    await instance.status();
  }
}
