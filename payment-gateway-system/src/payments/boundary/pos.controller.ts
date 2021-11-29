import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthMerchantsGuard } from '../../core/service/auth-merchants.guard';
import { PosService } from '../control/pos.service';
import { PosCreateRequestDto } from './dto/pos-create-request.dto';
import { PosDto } from './dto/pos.dto';
import { PosMapperService } from './mappers/pos-mapper.service';

@ApiTags('pos')
@ApiResponse({ status: 403, description: 'Forbidden.' })
@ApiResponse({ status: 406, description: 'Validation error.' })
@Controller('/pos')
@UseGuards(AuthMerchantsGuard)
export class PosController {
  constructor(private posService: PosService, private posMapperService: PosMapperService) {}

  @ApiOperation({ summary: 'Create a new Pos Definition' })
  @ApiResponse({
    status: 201,
    description: 'The created Pos',
  })
  @ApiResponse({ status: 400, description: 'Invalid Payload.' })
  @Post()
  async addPos(@Body() posDto: PosCreateRequestDto): Promise<PosDto> {
    const pos = await this.posMapperService.mapToEntity(posDto);
    await this.posService.createPos(pos);

    return this.posMapperService.mapToDto(pos);
  }
}
