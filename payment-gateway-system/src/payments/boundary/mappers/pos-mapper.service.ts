import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Client } from '../../entity/client';
import { Pos } from '../../entity/pos';
import { PosCreateRequestDto } from '../dto/pos-create-request.dto';
import { PosDto } from '../dto/pos.dto';

@Injectable()
export class PosMapperService {
  private readonly logger = new Logger(PosMapperService.name);

  constructor(
    @InjectModel(Pos)
    private readonly posModel: typeof Pos,
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
  ) {}

  async mapToEntity(posDto: PosCreateRequestDto): Promise<Pos> {
    const pos = this.posModel.build({ ...posDto });
    pos.client = this.clientModel.build({ uuid: posDto.clientUuid });
    return pos;
  }

  mapToDto(pos: Pos): PosDto {
    const { uuid, isActive } = pos;
    const posDto: PosDto = { uuid, isActive, client: null };
    return posDto;
  }
}
