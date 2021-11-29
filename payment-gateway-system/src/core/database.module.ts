import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfiguationModule } from './configuration.module';

// const databaseProviders = [
//   {
//     provide: 'SEQUELIZE',
//     useFactory: async () => {
//       const sequelize = new Sequelize({
//         dialect: 'postgres',
//         host: 'localhost',
//         port: 5432,
//         username: 'ecommerce',
//         password: 'ecommerce',
//         database: 'payments',
//         sync: { alter: true },
//       });
//       sequelize.addModels([Payment]);
//       await sequelize.sync();
//       return sequelize;
//     },
//   },
// ];

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfiguationModule],
      useFactory: (configService: ConfigService) => {
        return {
          dialect: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: +configService.get<string>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USERNAME'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          autoLoadModels: true,
          synchronize: configService.get<string>('SEQUELIZE_SYNCHRONIZE') === 'true' ? true : false,
          sync: { force: true },
        };
      },
      inject: [ConfigService],
    }),
    // SequelizeModule.forRoot({
    //   dialect: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   username: 'ecommerce',
    //   password: 'ecommerce',
    //   database: 'payments',
    //   autoLoadModels: true,
    //   synchronize: false,
    //   // sync: { force: true },
    // }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
