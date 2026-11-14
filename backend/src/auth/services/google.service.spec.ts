import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { GoogleService } from './google.service';
import { AppLoggerService } from '../../logger/logger.service';

const CLIENT_ID = 'client-id.apps.googleusercontent.com';

function jwt(claims: Record<string, unknown>): string {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'RS256' })}.${part(claims)}.signature`;
}

function validClaims(overrides: Record<string, unknown> = {}) {
  return {
    iss: 'https://accounts.google.com',
    aud: CLIENT_ID,
    sub: 'google-sub-1',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email: 'Player@Example.com',
    email_verified: true,
    ...overrides,
  };
}

describe('GoogleService', () => {
  let service: GoogleService;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;

    const config = {
      getOrThrow: (key: string) =>
        ({
          GOOGLE_CLIENT_ID: CLIENT_ID,
          GOOGLE_CLIENT_SECRET: 'secret',
          GOOGLE_REDIRECT_URI: 'http://127.0.0.1:3000/api/auth/google/callback',
        })[key],
    } as unknown as ConfigService;
    const logger = {
      child: () => ({ error: jest.fn() }),
    } as unknown as AppLoggerService;

    service = new GoogleService(config, logger);
  });

  function tokenEndpointReturns(idToken: string) {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id_token: idToken }),
    });
  }

  describe('buildAuthUrl', () => {
    it('asks for identity only, with PKCE and the state', () => {
      const url = new URL(service.buildAuthUrl('the-state', 'the-challenge'));

      expect(url.searchParams.get('scope')).toBe('openid email');
      expect(url.searchParams.get('state')).toBe('the-state');
      expect(url.searchParams.get('code_challenge')).toBe('the-challenge');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });
  });

  describe('exchangeCode', () => {
    it('reads the identity, with the address normalised', async () => {
      tokenEndpointReturns(jwt(validClaims()));

      await expect(service.exchangeCode('code', 'verifier')).resolves.toEqual({
        sub: 'google-sub-1',
        email: 'player@example.com',
        emailVerified: true,
      });
    });

    it('accepts email_verified sent as a string', async () => {
      tokenEndpointReturns(jwt(validClaims({ email_verified: 'true' })));

      const result = await service.exchangeCode('code', 'verifier');

      expect(result.emailVerified).toBe(true);
    });

    it('reports an unverified address as unverified', async () => {
      tokenEndpointReturns(jwt(validClaims({ email_verified: false })));

      const result = await service.exchangeCode('code', 'verifier');

      expect(result.emailVerified).toBe(false);
    });

    it.each([
      ['minted for another client', { aud: 'someone-else' }],
      ['from another issuer', { iss: 'https://evil.test' }],
      ['expired', { exp: Math.floor(Date.now() / 1000) - 1 }],
      ['without a subject', { sub: '' }],
    ])('refuses a token %s', async (_, overrides) => {
      tokenEndpointReturns(jwt(validClaims(overrides)));

      await expect(service.exchangeCode('code', 'verifier')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('refuses a token that is not a JWT', async () => {
      tokenEndpointReturns('not-a-jwt');

      await expect(service.exchangeCode('code', 'verifier')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
