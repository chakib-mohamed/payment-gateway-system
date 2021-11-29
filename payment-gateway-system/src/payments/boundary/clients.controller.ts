import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthMerchantsGuard } from '../../core/service/auth-merchants.guard';
import { ClientService } from '../control/client.service';
import { ClientCreateRequestDto } from './dto/client-create-request.dto';
import { ClientUpdateRequestDto } from './dto/client-update-request.dto';
import { ClientDto } from './dto/client.dto';
import { ClientsMapperService } from './mappers/clients-mapper.service';

@ApiTags('clients')
@ApiResponse({ status: 403, description: 'Forbidden.' })
@ApiResponse({ status: 406, description: 'Validation error.' })
@Controller('/clients')
@UseGuards(AuthMerchantsGuard)
export class ClientsController {
  constructor(private clientService: ClientService, private clientMapperService: ClientsMapperService) {}

  /**
   * Create a new Client
   */
  @ApiResponse({
    status: 201,
    description: 'The created Client',
    type: ClientDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid Payload.' })
  @Post()
  async addClient(@Body() clientDto: ClientCreateRequestDto): Promise<ClientDto> {
    const client = await this.clientMapperService.mapToEntity(clientDto);
    await this.clientService.createClient(client);

    return this.clientMapperService.mapToDto(client);
  }

  /**
   * Update a Client.
   */
  @ApiResponse({
    status: 201,
    description: 'The updated Client',
    type: ClientDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid Payload.' })
  @Put()
  async updateClient(@Body() clientDto: ClientUpdateRequestDto): Promise<ClientDto> {
    const client = await this.clientMapperService.mapToEntity(clientDto);
    await this.clientService.updateClient(client);

    return this.clientMapperService.mapToDto(client);
  }

  /**
   * Get a Client
   */
  @ApiResponse({
    status: 200,
    description: 'The Corresponding Client ',
    type: ClientDto,
  })
  @ApiResponse({
    status: 400,
    description: 'If the Client is Not Found',
  })
  @Get(':uuid')
  async getClient(@Param('uuid') uuid: string, @Req() req): Promise<ClientDto> {
    const client = await this.clientService.getClientByUuid(uuid);

    return this.clientMapperService.mapToDto(client);
  }
}
