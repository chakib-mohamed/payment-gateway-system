import { Req, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthMerchantsGuard } from '../../core/service/auth-merchants.guard';
import { ClientService } from '../control/client.service';
import { ClientCreateRequestDto } from './dto/client-create-request.dto';
import { ClientUpdateRequestDto } from './dto/client-update-request.dto';
import { ClientDto } from './dto/client.dto';
import { ClientsMapperService } from './mappers/clients-mapper.service';

@Resolver('Client')
@UseGuards(AuthMerchantsGuard)
export class ClientsResolver {
  constructor(private clientService: ClientService, private clientMapperService: ClientsMapperService) {}

  @Mutation((returns) => ClientDto)
  async addClient(@Args('clientCreateRequest') clientDto: ClientCreateRequestDto): Promise<ClientDto> {
    const client = await this.clientMapperService.mapToEntity(clientDto);
    await this.clientService.createClient(client);

    return this.clientMapperService.mapToDto(client);
  }

  @Mutation((returns) => ClientDto)
  async updateClient(@Args('clientUpdateRequest') clientDto: ClientUpdateRequestDto): Promise<ClientDto> {
    const client = await this.clientMapperService.mapToEntity(clientDto);
    await this.clientService.updateClient(client);

    return this.clientMapperService.mapToDto(client);
  }

  @Query((returns) => ClientDto, { name: 'client' })
  async getClient(@Args('uuid') uuid: string, @Req() req): Promise<ClientDto> {
    const client = await this.clientService.getClientByUuid(uuid);

    return this.clientMapperService.mapToDto(client);
  }
}
