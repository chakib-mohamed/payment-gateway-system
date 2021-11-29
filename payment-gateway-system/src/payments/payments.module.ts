import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CoreModule } from '../core/core.module';
import { ClientsController } from './boundary/clients.controller';
import { ClientsMapperService } from './boundary/mappers/clients-mapper.service';
import { PaymentsMapperService } from './boundary/mappers/payments-mapper.service';
import { PosMapperService } from './boundary/mappers/pos-mapper.service';
import { PaymentsController } from './boundary/payments.controller';
import { PosController } from './boundary/pos.controller';
import { CardValidatorService } from './control/card-validator.service';
import { ClientService } from './control/client.service';
import { AuthorizationService } from './control/authorization.service';
import { InitService } from './control/init.service';
import { PaymentService } from './control/payments.service';
import { PosService } from './control/pos.service';
import { CardType } from './entity/card-type';
import { Client } from './entity/client';
import { ClientCardType } from './entity/client-card-type';
import { Payment } from './entity/payment';
import { Pos } from './entity/pos';
import { HttpModule } from '@nestjs/axios';
import { Bank } from './entity/bank';
import { ThreeDSecureService } from './control/threeDSecure.service';
import { ClientsResolver } from './boundary/clients.resolver';
import { PaymentsResolver } from './boundary/payments.resolver';

@Module({
  imports: [SequelizeModule.forFeature([Payment, Pos, Client, CardType, ClientCardType, Bank]), CoreModule, HttpModule],
  controllers: [PaymentsController, PosController, ClientsController],
  providers: [
    InitService,
    PaymentService,
    PaymentsMapperService,
    PosMapperService,
    ClientsMapperService,
    PosService,
    ClientService,
    CardValidatorService,
    AuthorizationService,
    ThreeDSecureService,
    ClientsResolver,
    PaymentsResolver,
  ],
})
export class PaymentsModule {}
