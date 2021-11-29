import { IsBoolean, IsNotEmpty } from 'class-validator';

export class PosCreateRequestDto {
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @IsNotEmpty()
  clientUuid: string;
}
