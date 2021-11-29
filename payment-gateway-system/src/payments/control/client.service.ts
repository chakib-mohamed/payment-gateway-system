import { Injectable, Logger, NotAcceptableException, NotFoundException, Req, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from '../../core/service/user.service';
import { UtilsService } from '../../core/service/utils.service';
import { Bank } from '../entity/bank';
import { CardType } from '../entity/card-type';
import { Client } from '../entity/client';
import { ClientCardType } from '../entity/client-card-type';
import { Payment } from '../entity/payment';
import { Pos } from '../entity/pos';
import { ApiError } from './api-errors';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(CardType)
    private readonly cardTypeModel: typeof CardType,
    @InjectModel(ClientCardType)
    private readonly clientCardTypeModel: typeof ClientCardType,
    @InjectModel(Bank)
    private readonly bankModel: typeof Bank,
    @InjectModel(Payment)
    private readonly paymentModel: typeof Payment,
    private readonly utilsService: UtilsService,
    private readonly sequelize: Sequelize,
    private readonly userService: UserService,
  ) {}

  async createClient(client: Client): Promise<Client> {
    client.uuid = null;
    return this.verifyAndSaveClient(client);
  }

  private async verifyAndSaveClient(client: Client): Promise<Client> {
    await this.verifyAndSetBank(client);

    await this.sequelize.transaction(async (t) => {
      const transactionHost = { transaction: t };

      const resolvedCardTypes = await this.resolveCardTypes(client.supportedCardTypes);

      await client.save(transactionHost);
      await this.saveCardTypes(resolvedCardTypes, client, transactionHost);
    });
    return client;
  }

  private async saveCardTypes(resolvedCardTypes: CardType[], client: Client, transactionHost) {
    await Promise.all(
      resolvedCardTypes
        .map((ct) =>
          this.clientCardTypeModel.build({
            cardTypeId: ct.id,
            clientId: client.id,
          }),
        )
        .map(async (ct) => ct.destroy(transactionHost)),
    );
    // TODO cascade ?
    await this.clientCardTypeModel.bulkCreate(
      resolvedCardTypes.map((ct) => ({
        cardTypeId: ct.id,
        clientId: client.id,
      })),
      transactionHost,
    );
  }

  private async verifyAndSetBank(client: Client) {
    const { uuid } = client.bank;
    if (!this.utilsService.isUUIDValid(uuid)) {
      throw new NotAcceptableException(ApiError.ERR9);
    }
    const bank = await this.bankModel.findOne({
      where: {
        uuid,
      },
    });

    if (bank == null) {
      throw new NotAcceptableException(ApiError.ERR9);
    }
    client.bankId = bank.id;
  }

  private async resolveCardTypes(supportedCardTypes: CardType[]): Promise<CardType[]> {
    const resolvedCardTypes: CardType[] = [];

    await Promise.all(
      supportedCardTypes.map(async (sc) => {
        if (!this.utilsService.isUUIDValid(sc.uuid)) {
          throw new NotAcceptableException(ApiError.ERR6);
        }
        const cardType = await this.cardTypeModel.findOne({
          where: {
            uuid: sc.uuid,
          },
        });
        if (cardType == null) {
          throw new NotAcceptableException(ApiError.ERR6);
        }

        resolvedCardTypes.push(cardType);
      }),
    );

    return resolvedCardTypes;
  }

  async getClientByUuid(uuid: string): Promise<Client> {
    if (!this.utilsService.isUUIDValid(uuid)) {
      throw new NotAcceptableException(ApiError.ERR2);
    }

    const client = await this.clientModel.findOne({
      where: {
        uuid,
      },
      include: CardType,
    });
    if (client == null) {
      throw new NotFoundException(ApiError.ERR1);
    }
    if (client.clientId !== this.userService.getAuthenticatedUser()?.clientId) {
      throw new UnauthorizedException();
    }
    return client;
  }

  async updateClient(client: Client): Promise<Client> {
    const resolvedClient = await this.getClientByUuid(client.uuid);

    resolvedClient.name = client.name;
    resolvedClient.address = client.address;
    resolvedClient.isActive = client.isActive;
    resolvedClient.supportedCardTypes = client.supportedCardTypes;
    resolvedClient.bank = client.bank;
    resolvedClient.threshold = client.threshold;
    resolvedClient.redirectURL = client.redirectURL;

    await this.verifyAndSaveClient(resolvedClient);

    return resolvedClient;
  }

  async getClientRedirectURL(uuid: string): Promise<string> {
    const payment = await this.paymentModel.findOne({
      where: {
        uuid,
      },
      include: {
        model: Pos,
        include: [Client],
      },
    });

    if (payment.pos.client.clientId !== this.userService.getAuthenticatedUser().clientId) {
      throw new UnauthorizedException();
    }

    return payment.pos.client.redirectURL + '/' + uuid;
  }
}
