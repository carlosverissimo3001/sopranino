import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../logger/logger.service';
import { normalizeEmail } from '../utils/password';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

/** Identity only: no profile, no name, nothing to read on the user's behalf. */
const SCOPES = ['openid', 'email'];

export type GoogleIdentity = {
  /** Google's stable id for the account. The email can change; this cannot. */
  sub: string;
  email?: string;
  emailVerified: boolean;
};

type IdTokenClaims = {
  iss?: string;
  aud?: string;
  sub?: string;
  exp?: number;
  email?: string;
  email_verified?: boolean | string;
};

@Injectable()
export class GoogleService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly logger: AppLoggerService;

  constructor(configService: ConfigService, appLogger: AppLoggerService) {
    this.logger = appLogger.child(GoogleService.name);
    this.clientId = configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.clientSecret = configService.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    );
    this.redirectUri = configService.getOrThrow<string>('GOOGLE_REDIRECT_URI');
  }

  buildAuthUrl(state: string, codeChallenge: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: SCOPES.join(' '),
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      // Without this Google signs a returning user straight back into the
      // account it last used, which on a shared machine may not be theirs.
      prompt: 'select_account',
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  }

  /**
   * Trades the code for an ID token and reads who signed in from it.
   *
   * The signature is not checked, deliberately: the token comes straight from
   * Google's token endpoint over TLS, in exchange for our client secret, so
   * the channel already proves where it came from (OpenID Connect Core
   * 3.1.3.7). The claims are still checked, so a token minted for another
   * client or one that has expired is refused.
   */
  async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<GoogleIdentity> {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `Google token exchange failed: ${response.status}`,
        await response.text(),
      );
      if (response.status >= 500) {
        throw new BadGatewayException('Google is temporarily unavailable');
      }
      throw new BadRequestException('Google token exchange failed');
    }

    const body = (await response.json()) as { id_token?: unknown };
    if (typeof body.id_token !== 'string') {
      throw new BadGatewayException('Google returned no ID token');
    }

    return this.readIdentity(body.id_token);
  }

  private readIdentity(idToken: string): GoogleIdentity {
    const claims = decodeClaims(idToken);
    const now = Math.floor(Date.now() / 1000);

    if (
      !claims ||
      !claims.iss ||
      !ISSUERS.includes(claims.iss) ||
      claims.aud !== this.clientId ||
      typeof claims.exp !== 'number' ||
      claims.exp <= now ||
      typeof claims.sub !== 'string' ||
      !claims.sub
    ) {
      throw new UnauthorizedException('Google ID token is not valid');
    }

    return {
      sub: claims.sub,
      email: claims.email ? normalizeEmail(claims.email) : undefined,
      // Google has sent this as both a boolean and a string over the years.
      emailVerified:
        claims.email_verified === true || claims.email_verified === 'true',
    };
  }
}

function decodeClaims(jwt: string): IdTokenClaims | null {
  const payload = jwt.split('.')[1];
  if (!payload) return null;
  try {
    return JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as IdTokenClaims;
  } catch {
    return null;
  }
}
