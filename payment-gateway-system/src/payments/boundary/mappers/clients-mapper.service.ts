import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Bank } from '../../entity/bank';
import { CardType } from '../../entity/card-type';
import { Client } from '../../entity/client';
import { CardTypeDto } from '../dto/card-type.dto';
import { ClientCreateRequestDto } from '../dto/client-create-request.dto';
import { ClientDto } from '../dto/client.dto';

@Injectable()
export class ClientsMapperService {
  private readonly logger = new Logger(ClientsMapperService.name);

  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    @InjectModel(CardType)
    private readonly cardTypeModel: typeof CardType,
    @InjectModel(Bank)
    private readonly bankModel: typeof Bank,
  ) {}

  async mapToEntity(clientDto: ClientCreateRequestDto): Promise<Client> {
    const client = this.clientModel.build({ ...clientDto });
    client.bank = this.bankModel.build({ uuid: clientDto.bankUuid });

    const supportedCardTypes = clientDto.supportedCardTypes?.map((sc) => this.cardTypeModel.build({ ...sc }));
    client.supportedCardTypes = supportedCardTypes;

    return client;
  }

  mapToDto(client: Client): ClientDto {
    const { uuid, name, address, isActive, supportedCardTypes, redirectURL } = client;
    const supportedCardTypesDto: CardTypeDto[] = supportedCardTypes?.map((sct) => ({
      uuid: sct.uuid,
    }));
    const clientDto: ClientDto = {
      uuid,
      name,
      address,
      isActive,
      redirectURL,
      supportedCardTypes: supportedCardTypesDto,
    };

    return clientDto;
  }
}
