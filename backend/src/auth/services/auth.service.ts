import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { SpotifyAuthService } from './spotify-auth.service';
import { SessionService } from './session.service';
import { AccountMergeService } from './account-merge.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginStartResult } from '../types';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';
import { hasCredential } from '../utils/credentials';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateName } from '../utils/handle-generator';
import { EmailVerificationService } from './email-verification.service';
import { AuthMeResponseDto } from '../dto/auth.dto';
import { UserSessionDto } from '../dto/user-session.dto';
import { PatchUserDto } from '../dto/patch-user.dto';
import { AvatarSource } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private spotifyService: SpotifyService,
    private spotifyAuthService: SpotifyAuthService,
    private sessionService: SessionService,
    private userRepository: UserRepository,
    private accountMergeService: AccountMergeService,
    private emailVerification: EmailVerificationService,
  ) {}

  /**
   * Start OAuth flow: generate PKCE, store state, return auth URL
   */
  async startLogin(): Promise<LoginStartResult> {
    const state = uuidv4();
    const codeVerifier = this.spotifyService.generateCodeVerifier();
    const codeChallenge =
      this.spotifyService.generateCodeChallenge(codeVerifier);

    await this.sessionService.storePkceState(state, codeVerifier);

    const authUrl = this.spotifyService.buildAuthUrl(state, codeChallenge);

    return { authUrl, state };
  }

  /**
   * Handle OAuth callback: exchange code, fetch profile, create session.
   * The current session, if any, is the player signing in — their row is
   * either the one Spotify attaches to, or the one merged into it.
   */
  async handleCallback(
    code: string,
    state: string,
    currentSessionId?: string,
  ): Promise<string> {
    // Retrieve and validate PKCE state
    const pkceState = await this.sessionService.consumePkceState(state);
    if (!pkceState) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.spotifyService.exchangeCodeForTokens(
      code,
      pkceState.codeVerifier,
    );

    const profile = await this.spotifyService.getUserProfile(
      tokens.accessToken,
    );
    const displayName = profile.displayName || profile.id;

    const currentUserId = await this.resolveCurrentUserId(currentSessionId);
    const existing = await this.userRepository.findBySpotifyUserId(profile.id);

    // Only a row with no credentials may be claimed by this sign-in. A session
    // that already belongs to someone is a person switching accounts — on a
    // shared browser, treating it as a guest would delete the account they
    // walked away from.
    const current = currentUserId
      ? await this.userRepository.findById(currentUserId)
      : null;
    const claimable = current && !hasCredential(current) ? current : null;

    if (existing && claimable && claimable.id !== existing.id) {
      await this.accountMergeService.merge(claimable.id, existing.id);

      // The merged-away row is gone; a session still pointing at it would
      // fail every request and wedge this callback on any other device.
      if (currentSessionId) {
        await this.sessionService.deleteSession(currentSessionId);
      }
    }

    // The common path: an existing guest claims a Spotify id nobody holds.
    const user: UserEntity =
      !existing && claimable
        ? await this.userRepository.attachSpotify(claimable.id, {
            spotifyUserId: profile.id,
            avatarUrl: profile.avatarUrl,
            country: profile.country,
            displayName,
          })
        : await this.userRepository.upsert({
            spotifyUserId: profile.id,
            displayName,
            avatarUrl: profile.avatarUrl,
            country: profile.country,
          });

    // Store tokens via SpotifyAuthService (Redis cache + encrypted DB)
    await this.spotifyAuthService.storeTokens(
      profile.id,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
    );

    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
      spotifyUserId: profile.id,
    });

    return sessionId;
  }

  /**
   * Signing up turns the row the player already has into an account, so the
   * rounds they played as a guest are the rounds the account starts with.
   */
  async signup(
    email: string,
    password: string,
    currentSessionId?: string,
  ): Promise<string> {
    if (await this.userRepository.findByEmail(email)) {
      throw new ConflictException('That email is already registered');
    }

    const currentUserId = await this.resolveCurrentUserId(currentSessionId);
    const current = currentUserId
      ? await this.userRepository.findById(currentUserId)
      : null;

    // Same rule as the Spotify callback: only a row with nothing attached can
    // be claimed. On a shared browser the session may belong to someone else.
    const claimable = current && !hasCredential(current) ? current : null;
    const passwordHash = await hashPassword(password);

    const user = claimable
      ? await this.userRepository.attachPassword(
          claimable.id,
          email,
          passwordHash,
        )
      : await this.userRepository.createWithPassword(
          email,
          passwordHash,
          generateName(),
        );

    // Swallows its own failures. The account exists either way, and a provider
    // having a bad minute must not be the thing that fails a signup.
    await this.emailVerification.send(user.id, email);

    return this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
      spotifyUserId: user.spotifyUserId,
      email: user.email,
    });
  }

  /**
   * Logging in from a guest session brings that guest's progress with it, the
   * same way the Spotify callback does.
   */
  async login(
    email: string,
    password: string,
    currentSessionId?: string,
  ): Promise<string> {
    const user = await this.userRepository.findByEmail(email);

    // One message for both halves, so this cannot be used to find out which
    // addresses have accounts.
    const failed = new UnauthorizedException('Email or password is incorrect');
    if (!user?.passwordHash) {
      throw failed;
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw failed;
    }

    const currentUserId = await this.resolveCurrentUserId(currentSessionId);
    const current = currentUserId
      ? await this.userRepository.findById(currentUserId)
      : null;
    const claimable = current && !hasCredential(current) ? current : null;

    if (claimable && claimable.id !== user.id) {
      await this.accountMergeService.merge(claimable.id, user.id);
      if (currentSessionId) {
        await this.sessionService.deleteSession(currentSessionId);
      }
    }

    return this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
      spotifyUserId: user.spotifyUserId,
      email: user.email,
    });
  }

  /** A stale cookie is not an error here: it just means there is nothing to merge. */
  private async resolveCurrentUserId(
    sessionId?: string,
  ): Promise<string | undefined> {
    if (!sessionId) {
      return undefined;
    }
    try {
      const session = await this.sessionService.getSession(sessionId);
      return session.userId;
    } catch {
      return undefined;
    }
  }

  /**
   * Get current user info from session
   * @param sessionId - The session ID
   * @returns The current user info
   */
  async getCurrentUser(sessionId: string): Promise<AuthMeResponseDto> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const effectiveAvatarUrl =
      user.avatarSource === AvatarSource.CUSTOM
        ? user.customAvatarUrl
        : user.avatarUrl;

    return {
      userId: user.id,
      spotifyUserId: session.spotifyUserId,
      // Two different questions: one asks whether we can read their library,
      // the other whether their progress survives this browser.
      hasLinkedAccount: !!user.spotifyUserId,
      hasAccount: hasCredential(user),
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      displayName: session.displayName,
      isTrusted: user.isTrusted,
      isAdmin: user.isAdmin,
      avatarUrl: effectiveAvatarUrl ?? undefined,
      customAvatarUrl: user.customAvatarUrl ?? undefined,
      spotifyAvatarUrl: user.avatarUrl ?? undefined,
      avatarSource: user.avatarSource,
      country: user.country ?? undefined,
    };
  }

  /**
   * Resolves the session, then returns a valid Spotify access token.
   * @param sessionId - The session ID
   * @returns The session and a valid access token
   */
  async getValidAccessToken(
    sessionId: string,
  ): Promise<{ session: UserSessionDto; accessToken: string }> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (!session.spotifyUserId) {
      throw new ForbiddenException(
        'This action requires a linked Spotify account',
      );
    }

    const accessToken = await this.spotifyAuthService.getValidAccessToken(
      session.spotifyUserId,
    );

    return { session, accessToken };
  }

  /**
   * Get user by session ID (cookie value / Redis session key)
   * @param sessionId - The session ID from the cookie
   * @returns The user
   */
  async getUserBySessionId(sessionId: string): Promise<UserEntity> {
    const session = await this.sessionService.getSession(sessionId);
    return this.getUserById(session.userId);
  }

  /**
   * Get user by database user ID (users.id)
   */
  async getUserById(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Update the user's display name in DB and active session.
   */
  async updateProfile(
    sessionId: string,
    dto: PatchUserDto,
  ): Promise<AuthMeResponseDto> {
    const session = await this.sessionService.getSession(sessionId);
    const displayName = dto.displayName.trim();

    await this.userRepository.updateDisplayName(session.userId, displayName);
    await this.sessionService.updateSessionDisplayName(sessionId, displayName);

    return this.getCurrentUser(sessionId);
  }

  /**
   * Sends the verification link again for whoever is signed in. Silent about
   * the outcome: already verified, no address at all, and asking too often all
   * look the same from outside, which is the only way none of them is an
   * answer to a question about somebody else's account.
   */
  async resendVerificationEmail(sessionId: string): Promise<void> {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      return;
    }

    const user = await this.userRepository.findById(session.userId);
    if (!user?.email || user.emailVerifiedAt) {
      return;
    }

    await this.emailVerification.send(user.id, user.email);
  }

  /**
   * Changes a password the player still knows. The current one is required:
   * a session on a browser someone walked away from must not be enough to
   * lock its owner out of their own account.
   */
  async changePassword(
    sessionId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const session = await this.sessionService.getSession(sessionId);
    const user = await this.userRepository.findById(session.userId);

    const failed = new UnauthorizedException('Current password is incorrect');
    if (!user?.passwordHash) {
      throw failed;
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw failed;
    }

    await this.userRepository.setPassword(
      user.id,
      await hashPassword(newPassword),
    );

    // Everywhere but here. Whoever is doing this stays signed in; anything
    // else signed in as them does not.
    await this.sessionService.deleteSessionsForUser(user.id, sessionId);
  }

  /**
   * Logout: delete session and revoke cached tokens
   * @param sessionId - The session ID
   */
  async logout(sessionId: string): Promise<void> {
    // A session we cannot read still has a cookie to clear, so never fail here.
    let session: UserSessionDto | null = null;
    try {
      session = await this.sessionService.getSession(sessionId);
    } catch {
      session = null;
    }

    if (session?.spotifyUserId) {
      await this.spotifyAuthService.revokeTokens(session.spotifyUserId);
    }
    await this.sessionService.deleteSession(sessionId);
  }

  /**
   * Drop the device token so the browser is not re-attached to its old row.
   */
  async forgetDevice(deviceToken: string): Promise<void> {
    await this.sessionService.deleteDeviceToken(deviceToken);
  }
}
