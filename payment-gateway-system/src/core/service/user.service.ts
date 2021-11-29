import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

export type AuthenticatedUser = {
  clientId: string;
  realm_access: { roles: string[] };
};

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  getAuthenticatedUser(): AuthenticatedUser {
    return this.request.req ? this.request.req?.user : this.request.user;
  }
}
