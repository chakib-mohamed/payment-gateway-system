import { IsNotEmpty } from 'class-validator';

export class ChallengResultRequestDto {
  @IsNotEmpty()
  uuid: string;

  @IsNotEmpty()
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';

  @IsNotEmpty()
  statusCode: 0 | 1 | -1;
  message: string;
}
