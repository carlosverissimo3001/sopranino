import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { SessionService } from '@auth/services/session.service';
import { UserRepository } from '@auth/repositories/user.repository';
import { generateName } from '@auth/utils/handle-generator';
import { hasCredential } from '@auth/utils/credentials';
import { getCookieOptions } from '@auth/utils/http-helpers';
import {
  DEVICE_COOKIE_NAME,
  DEVICE_TOKEN_TTL,
  SESSION_COOKIE_NAME,
} from '../../consts';

/**
 * Self-provisioning, unlike SessionGuard: a missing or stale cookie mints a
 * real user rather than rejecting. Only routes that start a round carry it,
 * so a crawler on the landing page never creates a row.
 */
@Injectable()
export class ProvisioningSessionGuard implements CanActivate {
  private readonly sessionMaxAge: number;

  constructor(
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    this.sessionMaxAge =
      this.configService.get<number>('SESSION_MAX_AGE_SECONDS') || 604800;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const existing = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;
    const deviceToken = request.cookies?.[DEVICE_COOKIE_NAME] as
      | string
      | undefined;

    if (existing) {
      try {
        const session = await this.sessionService.getSession(existing);
        await this.sessionService.refreshUserSessionMapping(
          session.userId,
          existing,
        );

        // Sessions predating the device cookie still deserve one.
        if (!deviceToken && !hasCredential(session)) {
          await this.issueDeviceToken(request, response, session.userId);
        }
        return true;
      } catch {
        // Stale cookie: fall through and recover or provision an identity.
      }
    }

    if (deviceToken) {
      const userId = await this.sessionService.resolveDeviceToken(deviceToken);
      const user = userId ? await this.userRepository.findById(userId) : null;

      // A device token re-attaches an anonymous row and nothing else: honouring
      // it for an account of any kind would make a cookie a login.
      if (user && !hasCredential(user)) {
        const sessionId = await this.sessionService.createSession({
          userId: user.id,
          displayName: user.displayName,
          isTrusted: user.isTrusted,
        });
        this.setSessionCookie(request, response, sessionId);
        return true;
      }

      await this.sessionService.deleteDeviceToken(deviceToken);
    }

    const user = await this.userRepository.createAnonymous(generateName());
    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
    });

    this.setSessionCookie(request, response, sessionId);
    await this.issueDeviceToken(request, response, user.id);

    return true;
  }

  private setSessionCookie(
    request: Request,
    response: Response,
    sessionId: string,
  ): void {
    // @SessionId reads request.cookies, which the response cookie never reaches.
    request.cookies = { ...request.cookies, [SESSION_COOKIE_NAME]: sessionId };

    response.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
    );
  }

  private async issueDeviceToken(
    request: Request,
    response: Response,
    userId: string,
  ): Promise<void> {
    const token = await this.sessionService.createDeviceToken(userId);

    request.cookies = { ...request.cookies, [DEVICE_COOKIE_NAME]: token };
    response.cookie(
      DEVICE_COOKIE_NAME,
      token,
      getCookieOptions({ sessionMaxAge: DEVICE_TOKEN_TTL }),
    );
  }
}
