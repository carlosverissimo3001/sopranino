import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { SpotifyTokenResponseDto } from '../dto/spotify/spotify-token-response.dto';
import { SpotifyTokenDto } from '../dto/spotify/spotify-token.dto';
import { SpotifyUserProfileResponseDto } from '../dto/spotify/spotify-user-profile-response.dto';
import { SCOPES } from '../consts';
import { SpotifyNotAllowlistedError } from '../errors/spotify-not-allowlisted.error';
import { AppLoggerService } from '../../logger/logger.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class SpotifyService {
  private readonly clientId: string;
  private readonly redirectUri: string;

  constructor(
    private configService: ConfigService,
    private logger: AppLoggerService,
  ) {
    this.clientId = this.configService.getOrThrow<string>('SPOTIFY_CLIENT_ID');
    this.redirectUri = this.configService.getOrThrow<string>(
      'SPOTIFY_REDIRECT_URI',
    );
  }

  /**
   * Validates external API responses against a DTO.
   * This ensures DTO contracts are upheld at runtime.
   */
  private async validateExternalResponse<T extends object>(
    cls: new (...args: unknown[]) => T,
    plain: unknown,
  ): Promise<T> {
    const instance = plainToInstance(cls, plain, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });
    const errors = await validate(instance, {
      whitelist: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      const validationSummary = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints
          ? Object.keys(error.constraints)
          : 'nested validation error',
      }));

      this.logger.error(
        `External API Validation Failed: ${cls.name}`,
        validationSummary,
      );

      throw new BadGatewayException('External API contract violation');
    }

    return instance;
  }

  /**
   * Generate PKCE code verifier (random 43-128 chars)
   */
  generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge from verifier (SHA256 + base64url)
   */
  generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * Build Spotify authorization URL with PKCE
   */
  buildAuthUrl(state: string, codeChallenge: string): string {
    const scope = SCOPES.join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope,
      state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * @param code - The authorization code received from Spotify
   * @param codeVerifier - The PKCE code verifier
   * @returns The Spotify tokens (includes access and refresh tokens)
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
  ): Promise<SpotifyTokenDto> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Spotify token exchange failed: ${response.status}`,
        errorText,
      );

      if (response.status >= 500) {
        throw new BadGatewayException('Spotify is temporarily unavailable');
      }
      throw new BadRequestException('Spotify token exchange failed');
    }

    const rawData = await response.json();

    const data = await this.validateExternalResponse(
      SpotifyTokenResponseDto,
      rawData,
    );

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? '',
      expiresIn: data.expires_in,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token
   * @returns The new Spotify tokens (refreshed access token and possibly new refresh token, if provided)
   */
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenDto> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Spotify token refresh failed: ${error}`);
    }

    const rawData = await response.json();

    const data = await this.validateExternalResponse(
      SpotifyTokenResponseDto,
      rawData,
    );

    return {
      accessToken: data.access_token,
      // Spotify may or may not return a new refresh token
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
  }

  /**
   * Fetch user profile from Spotify /me endpoint
   * @param accessToken - The access token to use for the request
   * @returns The user profile
   */
  async getUserProfile(accessToken: string): Promise<UserProfileDto> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === HttpStatus.UNAUTHORIZED) {
        throw new UnauthorizedException('Spotify token is invalid or expired');
      }

      // Consent succeeds for anyone; the profile is refused to accounts off
      // the Development Mode allowlist.
      if (response.status === HttpStatus.FORBIDDEN) {
        throw new SpotifyNotAllowlistedError();
      }

      if (response.status === HttpStatus.TOO_MANY_REQUESTS) {
        const retryAfter = response.headers.get('Retry-After');
        const parsedWaitTime = retryAfter ? parseInt(retryAfter, 10) : NaN;
        const waitTime = !isNaN(parsedWaitTime) ? parsedWaitTime : 60;

        this.logger.warn(`Rate limited. Retry after ${waitTime}s`);
        throw new HttpException(
          `Rate limited. Try again in ${waitTime}s`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      this.logger.error(
        `Spotify API error: ${response.status} ${response.statusText}`,
      );
      throw new BadRequestException(`Spotify API returned ${response.status}`);
    }

    const rawData = await response.json();

    const profileResponse = await this.validateExternalResponse(
      SpotifyUserProfileResponseDto,
      rawData,
    );

    return {
      id: profileResponse.id,
      displayName: profileResponse.display_name,
      avatarUrl: profileResponse.images?.[0]?.url ?? undefined,
      country: profileResponse.country ?? undefined,
    };
  }
}
