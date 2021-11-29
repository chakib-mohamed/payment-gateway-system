import { Injectable, Logger, NotAcceptableException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserService } from '../../core/service/user.service';
import { UtilsService } from '../../core/service/utils.service';
import { Client } from '../entity/client';
import { Pos } from '../entity/pos';
import { ApiError } from './api-errors';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    @InjectModel(Client)
    private readonly clientModel: typeof Client,
    private readonly utilsService: UtilsService,
    private readonly userService: UserService,
  ) {}

  async createPos(pos: Pos): Promise<Pos> {
    pos.uuid = null;
    await this.validateAndSetClient(pos);
    return await pos.save();
  }

  private async validateAndSetClient(pos: Pos) {
    const { uuid } = pos.client;
    if (!this.utilsService.isUUIDValid(uuid)) {
      throw new NotAcceptableException(ApiError.ERR2);
    }
    const client = await this.clientModel.findOne({
      where: {
        uuid,
      },
    });

    if (client == null) {
      throw new NotAcceptableException(ApiError.ERR2);
    }

    if (client.clientId !== this.userService.getAuthenticatedUser().clientId) {
      throw new UnauthorizedException();
    }

    pos.clientId = client.id;
  }
}
