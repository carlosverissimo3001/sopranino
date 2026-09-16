import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '@auth/services/session.service';
import { hasCredential } from '@auth/utils/credentials';
import { SESSION_COOKIE_NAME } from '../../consts';

/**
 * Any credential will do, unlike SpotifyLinkedGuard: this asks whether the
 * player has an account at all. Spotify is the only one today, so the two
 * agree;
 */
@Injectable()
export class LinkedAccountGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (!sessionId) {
      throw new UnauthorizedException('No active session found');
    }

    const session = await this.sessionService.getSession(sessionId);
    if (!hasCredential(session)) {
      throw new ForbiddenException('This action requires an account');
    }

    return true;
  }
}
