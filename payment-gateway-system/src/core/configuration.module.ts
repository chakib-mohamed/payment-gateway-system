import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const ENV = process.env.NODE_ENV;
let PATH = process.env.CONF_PATH;

if (ENV === 'test' && PATH == null) {
  PATH = './test';
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${PATH != null ? PATH + '/' : ''}.env${ENV != null ? '.' + ENV : ''}`,
      // isGlobal: true, // if declared on AppModule
      // load: [configuration],
      cache: true,
    }),
  ],
  exports: [ConfigModule],
})
export class ConfiguationModule {}
