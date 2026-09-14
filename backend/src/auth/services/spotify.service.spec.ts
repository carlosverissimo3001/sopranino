import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AppLoggerService } from '../../logger/logger.service';
import { SpotifyNotAllowlistedError } from '../errors/spotify-not-allowlisted.error';
import { SpotifyService } from './spotify.service';

describe('SpotifyService.getUserProfile', () => {
  const service = new SpotifyService(
    { getOrThrow: () => 'x' } as unknown as ConfigService,
    {
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
    } as unknown as AppLoggerService,
  );
  const respond = (status: number) =>
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('User not registered in the Developer Dashboard', {
        status,
      }),
    );

  afterEach(() => jest.restoreAllMocks());

  // Consent succeeded; only the allowlist stands between them and the app.
  it('names a 403 as an account missing from the allowlist', async () => {
    respond(403);

    await expect(service.getUserProfile('token')).rejects.toThrow(
      SpotifyNotAllowlistedError,
    );
  });

  it('still treats a 401 as a bad token', async () => {
    respond(401);

    await expect(service.getUserProfile('token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
