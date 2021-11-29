import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthMerchantsGuard } from '../../core/service/auth-merchants.guard';
import { PanThrottlerGuard } from '../../core/service/pan-throttler.guard';
import { ClientService } from '../control/client.service';
import { PaymentService } from '../control/payments.service';
import { ChallengResultRequestDto } from './dto/challenge-result-request.dto';
import { ChallengResultResponseDto } from './dto/challenge-result-response.dto';
import { PaymentResponseDto } from './dto/payment-reponse.dto';
import { PaymentRequestDto } from './dto/payment-request.dto';
import { PaymentsMapperService } from './mappers/payments-mapper.service';

@ApiTags('payments')
@ApiResponse({ status: 403, description: 'Forbidden.' })
@Controller()
@UseGuards(AuthMerchantsGuard)
export class PaymentsController {
  constructor(
    private paymentService: PaymentService,
    private paymentMapper: PaymentsMapperService,
    private readonly clientService: ClientService,
  ) {}

  /**
   * Process a Payment Request.
   */
  @Post('payments')
  @ApiResponse({
    status: 201,
    description: 'The created payment',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 302,
    description: "Validation required : Redirect to the bank's confirmation page",
  })
  @ApiResponse({ status: 400, description: 'Invalid Payload.' })
  @ApiResponse({ status: 406, description: 'Validation error.' })
  @UseGuards(PanThrottlerGuard)
  async processPayment(@Res() res, @Body() paymentDto: PaymentRequestDto): Promise<PaymentResponseDto> {
    const payment = await this.paymentMapper.mapToEntity(paymentDto);
    const result = await this.paymentService.processPayment(payment);

    if (typeof result == 'string') res.redirect(result);

    return this.paymentMapper.mapToDto(payment);
  }

  /**
   * Result of "3DS" challenge.
   */
  @Post('result')
  @ApiResponse({
    status: 201,
    description: 'The created payment',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid Payload.' })
  @ApiResponse({ status: 406, description: 'Validation error.' })
  async result(@Body() chanllengeResult: ChallengResultRequestDto): Promise<ChallengResultResponseDto> {
    await this.paymentService.challengeResult(chanllengeResult);
    return {};
  }

  /**
   * Redirect to the merchant success payment page
   */
  @Get('redirect/:uuid')
  @ApiResponse({ status: 406, description: 'Validation error.' })
  @ApiResponse({
    status: 302,
    description: "Redirect to the merchant's success page ",
  })
  async redirect(@Res() response, @Param('uuid') uuid: string) {
    const clientRedirectURL = await this.clientService.getClientRedirectURL(uuid);
    response.redirect(clientRedirectURL);
  }
}
