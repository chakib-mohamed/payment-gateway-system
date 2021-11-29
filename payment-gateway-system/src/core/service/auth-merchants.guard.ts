import { ExecutionContext, Injectable } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class AuthMerchantsGuard extends AuthGuard('merchants') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    if (context instanceof ExecutionContextHost && (context as ExecutionContextHost).getType().toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);

      const { req } = ctx.getContext();
      return super.canActivate(new ExecutionContextHost([req]));
    } else {
      return super.canActivate(context);
    }
  }
}
