import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class PanThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): string {
    return req.body.cardNumber;
  }
}
