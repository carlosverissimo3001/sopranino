import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';
import { PkceStateDto } from '../dto/pcke-state.dto';
import { UserSessionDto } from '../dto/user-session.dto';
import { DEVICE_TOKEN_PREFIX, DEVICE_TOKEN_TTL } from '../../consts';

export interface CreateSessionParams {
  userId: string;
  displayName: string;
  isTrusted: boolean;
  spotifyUserId?: string;
  googleUserId?: string;
  email?: string;
}

@Injectable()
export class SessionService {
  private readonly sessionMaxAge: number;
  private readonly pkceStateTtl = 600; // 10 minutes for PKCE state

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.sessionMaxAge =
      this.configService.get<number>('SESSION_MAX_AGE_SECONDS') || 604800; // 7 days
  }

  /**
   * Store PKCE state temporarily during OAuth flow
   * @param state - The state
   * @param codeVerifier - The code verifier
   * @param linkUserId - The account to link to, when this is a link and not a sign-in
   */
  async storePkceState(
    state: string,
    codeVerifier: string,
    linkUserId?: string,
  ): Promise<void> {
    const data: PkceStateDto = {
      codeVerifier,
      createdAt: Date.now(),
      ...(linkUserId && { linkUserId }),
    };
    await this.redisService.set(
      `pkce:${state}`,
      JSON.stringify(data),
      this.pkceStateTtl,
    );
  }

  /**
   * Retrieve and delete PKCE state (one-time use)
   * @param state - The state
   * @returns The PKCE state
   */
  async consumePkceState(state: string): Promise<PkceStateDto> {
    const key = `pkce:${state}`;
    const data = await this.redisService.get(key);
    if (!data) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    await this.redisService.del(key);
    try {
      return JSON.parse(data) as PkceStateDto;
    } catch {
      throw new UnauthorizedException('Corrupted OAuth state');
    }
  }

  /**
   * Create a new user session
   * @param params - The session parameters
   * @returns The session ID
   */
  async createSession(params: CreateSessionParams): Promise<string> {
    const sessionId = uuidv4();

    const session: UserSessionDto = {
      sessionId,
      userId: params.userId,
      spotifyUserId: params.spotifyUserId,
      googleUserId: params.googleUserId,
      email: params.email,
      displayName: params.displayName,
      isTrusted: params.isTrusted,
      createdAt: Date.now(),
    };

    await this.redisService.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      this.sessionMaxAge,
    );

    // Reverse mapping: userId -> sessionId (for multiplayer track pooling)
    await this.redisService.set(
      `user-session:${params.userId}`,
      sessionId,
      this.sessionMaxAge,
    );

    // Every session, not just the newest. The mapping above holds one, which
    // is all the multiplayer lookup wants; signing someone out everywhere
    // needs the whole set.
    const client = this.redisService.getClient();
    const setKey = `user-sessions:${params.userId}`;
    await client.sadd(setKey, sessionId);
    await client.expire(setKey, this.sessionMaxAge);

    return sessionId;
  }

  /**
   * Get session by ID
   * @param sessionId - The session ID
   * @returns The session
   */
  async getSession(sessionId: string): Promise<UserSessionDto> {
    const data = await this.redisService.get(`session:${sessionId}`);
    if (!data) {
      throw new UnauthorizedException('Session not found');
    }
    let session: UserSessionDto;
    try {
      session = JSON.parse(data) as UserSessionDto;
    } catch {
      throw new UnauthorizedException('Corrupted session data');
    }

    // A session stored before the re-key has no user to resolve against.
    if (!session.userId) {
      throw new UnauthorizedException('Session not found');
    }

    return session;
  }

  /**
   * Mint a device token pointing at a user. Lives far longer than a session,
   * so an anonymous player keeps their row across logout and session expiry.
   */
  async createDeviceToken(userId: string): Promise<string> {
    const token = uuidv4();
    await this.redisService.set(
      `${DEVICE_TOKEN_PREFIX}${token}`,
      userId,
      DEVICE_TOKEN_TTL,
    );
    return token;
  }

  /**
   * Resolve a device token to a user id, extending its life on use.
   */
  async resolveDeviceToken(token: string): Promise<string | null> {
    const key = `${DEVICE_TOKEN_PREFIX}${token}`;
    const userId = await this.redisService.get(key);
    if (!userId) {
      return null;
    }

    await this.redisService.set(key, userId, DEVICE_TOKEN_TTL);
    return userId;
  }

  async deleteDeviceToken(token: string): Promise<void> {
    await this.redisService.del(`${DEVICE_TOKEN_PREFIX}${token}`);
  }

  /**
   * Refresh the reverse mapping (userId -> sessionId) so it stays
   * alive as long as the user is actively making requests.
   */
  async refreshUserSessionMapping(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.redisService.set(
      `user-session:${userId}`,
      sessionId,
      this.sessionMaxAge,
    );
  }

  /**
   * Get a session ID by user ID (reverse lookup).
   * Returns null if no active session exists for the user.
   */
  async getSessionIdByUserId(userId: string): Promise<string | null> {
    const sessionId = await this.redisService.get(`user-session:${userId}`);
    if (!sessionId) {
      return null;
    }

    // Verify the session still exists (it may have expired)
    const exists = await this.redisService.exists(`session:${sessionId}`);
    if (!exists) {
      await this.redisService.del(`user-session:${userId}`);
      return null;
    }

    return sessionId;
  }

  /**
   * Update the display name stored in an active session.
   * Preserves the remaining TTL so the session expiry is unchanged.
   */
  async updateSessionDisplayName(
    sessionId: string,
    displayName: string,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    const remaining = await this.redisService.ttl(key);
    const session = await this.getSession(sessionId);
    const updated: UserSessionDto = { ...session, displayName };
    await this.redisService.set(
      key,
      JSON.stringify(updated),
      remaining > 0 ? remaining : this.sessionMaxAge,
    );
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    try {
      // Clean up reverse mapping before deleting the session
      const data = await this.redisService.get(sessionKey);
      if (data) {
        try {
          const session = JSON.parse(data) as UserSessionDto;
          const userSessionKey = `user-session:${session.userId}`;
          const currentSessionId = await this.redisService.get(userSessionKey);

          // Only delete the reverse mapping if it still points to this session
          if (currentSessionId === sessionId) {
            await this.redisService.del(userSessionKey);
          }
          await this.redisService
            .getClient()
            .srem(`user-sessions:${session.userId}`, sessionId);
        } catch {
          // Ignore parse errors during cleanup
        }
      }
    } finally {
      await this.redisService.del(sessionKey);
    }
  }

  /**
   * Signs a user out of every browser. Used where a password has changed:
   * "I want a new password" and "someone else has my old one" are the same
   * request, so both are answered by ending every session but the one asking.
   */
  async deleteSessionsForUser(userId: string, keep?: string): Promise<void> {
    const client = this.redisService.getClient();
    const setKey = `user-sessions:${userId}`;
    const sessionIds = await client.smembers(setKey);

    for (const sessionId of sessionIds) {
      if (sessionId === keep) continue;
      await this.deleteSession(sessionId);
      await client.srem(setKey, sessionId);
    }

    if (!keep) {
      await this.redisService.del(setKey);
    }
  }
}
