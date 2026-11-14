import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { GoogleIdentity, GoogleService } from './google.service';
import { SessionService } from './session.service';
import { AccountMergeService } from './account-merge.service';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';
import { LoginStartResult } from '../types';
import { hasCredential } from '../utils/credentials';
import { generateName } from '../utils/handle-generator';
import { GoogleAccountInUseError } from '../errors/google-account-in-use.error';

export type GoogleCallbackResult =
  | { linked: true }
  | { linked: false; sessionId: string };

@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly google: GoogleService,
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
    private readonly accountMergeService: AccountMergeService,
  ) {}

  async startLogin(): Promise<LoginStartResult> {
    return this.start();
  }

  /**
   * Starts a flow that adds Google to the account this session is signed in
   * to. Only an account can link: a guest signs in instead, which already
   * keeps what they played.
   */
  async startLink(sessionId?: string): Promise<LoginStartResult> {
    const userId = await this.resolveCurrentUserId(sessionId);
    const user = userId ? await this.userRepository.findById(userId) : null;
    if (!user || !hasCredential(user)) {
      throw new UnauthorizedException('Sign in to link a Google account');
    }
    return this.start(user.id);
  }

  private async start(linkUserId?: string): Promise<LoginStartResult> {
    const state = uuidv4();
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    await this.sessionService.storePkceState(state, codeVerifier, linkUserId);

    return { authUrl: this.google.buildAuthUrl(state, codeChallenge), state };
  }

  /**
   * Finishes either flow. A link leaves the session as it is; a sign-in
   * returns a new one.
   *
   * Which row a sign-in lands on, in order: the one already holding this
   * Google account; else the one holding the address Google verified; else
   * the guest this browser is playing as; else a fresh row. A guest that is
   * not where they land is merged into it, the same as a Spotify or password
   * sign-in.
   */
  async handleCallback(
    code: string,
    state: string,
    currentSessionId?: string,
  ): Promise<GoogleCallbackResult> {
    const pkceState = await this.sessionService.consumePkceState(state);
    const identity = await this.google.exchangeCode(
      code,
      pkceState.codeVerifier,
    );

    const currentUserId = await this.resolveCurrentUserId(currentSessionId);

    if (pkceState.linkUserId) {
      await this.link(pkceState.linkUserId, currentUserId, identity.sub);
      return { linked: true };
    }

    return {
      linked: false,
      sessionId: await this.signIn(identity, currentUserId, currentSessionId),
    };
  }

  private async link(
    linkUserId: string,
    currentUserId: string | undefined,
    googleUserId: string,
  ): Promise<void> {
    // Signed out, or into someone else, since the link started.
    if (currentUserId !== linkUserId) {
      throw new UnauthorizedException('The session that started this changed');
    }

    const holder = await this.userRepository.findByGoogleUserId(googleUserId);
    if (holder) {
      if (holder.id === linkUserId) return; // Linked already; nothing to do.
      throw new GoogleAccountInUseError();
    }

    const user = await this.userRepository.findById(linkUserId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    // Swapping one Google account for another is not what this button is for.
    if (user.googleUserId) {
      throw new ConflictException('A different Google account is linked');
    }

    await this.userRepository.setGoogleUserId(linkUserId, googleUserId);
  }

  private async signIn(
    identity: GoogleIdentity,
    currentUserId: string | undefined,
    currentSessionId: string | undefined,
  ): Promise<string> {
    const verifiedEmail = identity.emailVerified ? identity.email : undefined;

    const current = currentUserId
      ? await this.userRepository.findById(currentUserId)
      : null;
    // A session that already belongs to an account is someone switching
    // accounts on a shared browser, never a guest to fold in.
    const claimable = current && !hasCredential(current) ? current : null;

    let user = await this.findAccount(identity.sub, verifiedEmail);

    if (user) {
      if (claimable && claimable.id !== user.id) {
        await this.accountMergeService.merge(claimable.id, user.id);
        // The merged-away row is gone; a session still pointing at it would
        // fail every request.
        if (currentSessionId) {
          await this.sessionService.deleteSession(currentSessionId);
        }
      }
    } else if (claimable) {
      user = await this.userRepository.attachGoogle(
        claimable.id,
        identity.sub,
        verifiedEmail,
      );
    } else {
      user = await this.userRepository.createWithGoogle(
        identity.sub,
        generateName(),
        verifiedEmail,
      );
    }

    return this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
      spotifyUserId: user.spotifyUserId,
      googleUserId: user.googleUserId,
      email: user.email,
    });
  }

  /**
   * The account this Google sign-in belongs to, linking Google to it when it
   * is found by address. Only a verified address may link: an unverified one
   * is just text the Google user typed.
   */
  private async findAccount(
    googleUserId: string,
    verifiedEmail: string | undefined,
  ): Promise<UserEntity | null> {
    const linked = await this.userRepository.findByGoogleUserId(googleUserId);
    if (linked) return linked;
    if (!verifiedEmail) return null;

    const byEmail = await this.userRepository.findByEmail(verifiedEmail);
    if (!byEmail) return null;

    // Holding a different Google account already. Re-pointing it would hand
    // this account to whoever holds the new one.
    if (byEmail.googleUserId) {
      throw new ConflictException(
        'That email belongs to an account linked to another Google account',
      );
    }

    return this.userRepository.linkGoogle(byEmail.id, googleUserId);
  }

  /** A stale cookie is not an error here: it just means there is nothing to merge. */
  private async resolveCurrentUserId(
    sessionId?: string,
  ): Promise<string | undefined> {
    if (!sessionId) return undefined;
    try {
      const session = await this.sessionService.getSession(sessionId);
      return session.userId;
    } catch {
      return undefined;
    }
  }
}
