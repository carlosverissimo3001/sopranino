import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '@auth/services/auth.service';
import { hasCompletedSignup } from '@auth/utils/credentials';
import { SESSION_COOKIE_NAME } from '../../consts';

@Injectable()
export class SignedUpGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (!sessionId) {
      throw new UnauthorizedException('No active session found');
    }

    const user = await this.authService.getUserBySessionId(sessionId);
    if (!hasCompletedSignup(user)) {
      throw new ForbiddenException('This needs an account');
    }

    return true;
  }
}
