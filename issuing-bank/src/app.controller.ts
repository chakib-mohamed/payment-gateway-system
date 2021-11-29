import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthenticationRequest, AuthenticationResponse, AuthorizationRequest, AuthorizationResponse } from './models';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Authorize a payment
   */
  @Post('/authorize')
  authorize(@Body() authRequest: AuthorizationRequest): AuthorizationResponse {
    return this.appService.authorize(authRequest);
  }

  /**
   * 3DS Authentication
   */
  @Post('/authenticate')
  authenticate(@Body() authRequest: AuthenticationRequest): AuthenticationResponse {
    return this.appService.authenticate(authRequest)[0];
  }

  @Get('/validate-otp/:uuid')
  @Header('content-type', 'text/html')
  getValidateOTP(@Param('uuid') uuid: string): string {
    return `<html>
              <body>
                <form method="post" action="/validate-otp">
                  <input type="hidden" name="uuid" value="${uuid}" />
                  <input type="text" name="otp" />
            
                  <button type="submit">Validate</button>
                </form>
              </body>
            </html>`;
  }

  @Post('/validate-otp')
  async postValidateOTP(@Res() res, @Body() formData: { uuid: string; otp: string }): Promise<void> {
    const redirect = await this.appService.validateOTP(formData.uuid, formData.otp);
    res.redirect(redirect);
  }
}
