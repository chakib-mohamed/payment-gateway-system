import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Bank } from '../entity/bank';
import { CardType } from '../entity/card-type';

@Injectable()
export class InitService implements OnModuleInit {
  constructor(
    @InjectModel(CardType)
    private readonly cardTypeModel: typeof CardType,
    @InjectModel(Bank)
    private readonly bankModel: typeof Bank,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const initDB = this.configService.get('INIT_DB');
    if (initDB === 'true') {
      await this.loadCardTypes();
      await this.initBanks();
    }
  }

  async loadCardTypes(): Promise<CardType[]> {
    let cardsTypes = [];

    const visa = await this.cardTypeModel.findOne({ where: { name: 'VISA' } });
    const mastercard = await this.cardTypeModel.findOne({
      where: { name: 'MASTERCARD' },
    });
    const dinersClub = await this.cardTypeModel.findOne({
      where: { name: 'DINERS_CLUB' },
    });

    if (visa == null) {
      cardsTypes = [
        ...cardsTypes,
        {
          name: 'VISA',
          pattern: '^4[0-9]{12}(?:[0-9]{3}){0,2}$',
          uuid: uuidv4(),
        },
      ];
    }
    if (mastercard == null) {
      cardsTypes = [
        ...cardsTypes,
        {
          name: 'MASTERCARD',
          pattern: '^(?:5[1-5]|2(?!2([01]|20)|7(2[1-9]|3))[2-7])\\d{14}$',
          uuid: uuidv4(),
        },
      ];
    }
    if (dinersClub == null) {
      cardsTypes = [
        ...cardsTypes,
        {
          name: 'DINERS_CLUB',
          pattern: '^3(?:0[0-5]|[68][0-9])[0-9]{11}$',
          uuid: uuidv4(),
        },
      ];
    }

    return cardsTypes.length > 0 ? this.cardTypeModel.bulkCreate(cardsTypes) : [visa, mastercard, dinersClub];
  }

  async initBanks(): Promise<Bank[]> {
    let banks = [];

    const dummyBank: Bank = await this.bankModel.findOne({
      where: { name: 'DUMMY_BNK' },
    });

    if (dummyBank == null) {
      banks = [
        ...banks,
        {
          name: 'DUMMY_BNK',
          bin: 402400,
          authorizationURL: 'http://localhost:3001/authorize',
          AReqURL: 'http://localhost:3001/authenticate',
          uuid: uuidv4(),
        },
      ];
    }

    const dummyBank2: Bank = await this.bankModel.findOne({
      where: { name: 'DUMMY_BNK_2' },
    });

    if (dummyBank2 == null) {
      banks = [
        ...banks,
        {
          name: 'DUMMY_BNK_2',
          BIN: 527116,
          authorizationURL: 'http://localhost:3002/authorize',
          AReqURL: 'http://localhost:3002/authenticate',
          uuid: uuidv4(),
        },
      ];
    }

    return banks.length > 0 ? this.bankModel.bulkCreate(banks) : [dummyBank, dummyBank2];
  }
}
