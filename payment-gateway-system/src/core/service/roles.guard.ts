import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticatedUser, UserService } from './user.service';

export const ROLES = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private userService: UserService) {}

  canActivate(context: ExecutionContext) {
    const roles: string[] = this.reflector.get<string[]>(ROLES, context.getHandler());
    if (!roles || roles.length == 0) {
      return true;
    }

    let authUser: AuthenticatedUser;
    if (context instanceof ExecutionContextHost && (context as ExecutionContextHost).getType().toString() === 'graphql') {
      const ctx = GqlExecutionContext.create(context);

      const { req } = ctx.getContext();
      authUser = req.user;
    } else {
      authUser = this.userService.getAuthenticatedUser();
    }

    if (roles.every((r) => authUser.realm_access?.roles?.includes(r))) {
      return true;
    }

    return false;
  }
}
