import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ClientDto } from './client.dto';

export class PosDto {
  uuid?: string;

  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @IsNotEmpty()
  client: ClientDto;
}
