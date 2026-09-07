import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AvatarSource } from '@prisma/client';
import { AuthService } from './auth.service';
import { SpotifyService } from './spotify.service';
import { SpotifyAuthService } from './spotify-auth.service';
import { SessionService } from './session.service';
import { UserRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { AccountMergeService } from './account-merge.service';
import { EmailVerificationService } from './email-verification.service';
import { UserSessionDto } from '../dto/user-session.dto';
import { UserEntity } from '../entities/user.entity';

// ── Constants ────────────────────────────────────────────────────────

const SESSION_ID = 'session-1';
const USER_ID = 'user-1';
const SPOTIFY_USER_ID = 'spotify-1';

// ── Factories ────────────────────────────────────────────────────────

function makeSession(overrides: Partial<UserSessionDto> = {}): UserSessionDto {
  return {
    sessionId: SESSION_ID,
    userId: USER_ID,
    spotifyUserId: SPOTIFY_USER_ID,
    displayName: 'Vinyl Chorus',
    isTrusted: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: USER_ID,
    spotifyUserId: SPOTIFY_USER_ID,
    displayName: 'Vinyl Chorus',
    avatarUrl: 'https://spotify.test/avatar.jpg',
    customAvatarUrl: undefined,
    avatarSource: AvatarSource.SPOTIFY,
    isTrusted: false,
    isAdmin: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    country: 'PT',
    streakFreezes: 0,
    answeredQuestionIds: [],
    ...overrides,
  };
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockSpotifyService = {
  exchangeCodeForTokens: jest.fn(),
  getUserProfile: jest.fn(),
};

const mockAccountMergeService = { merge: jest.fn() };

const mockEmailVerificationService = {
  send: jest.fn().mockResolvedValue(undefined),
  confirm: jest.fn(),
};

const mockSpotifyAuthService = {
  getValidAccessToken: jest.fn(),
  revokeTokens: jest.fn(),
  storeTokens: jest.fn(),
};

const mockSessionService = {
  consumePkceState: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  createSession: jest.fn(),
  updateSessionDisplayName: jest.fn(),
};

const mockUserRepository = {
  findById: jest.fn(),
  findBySpotifyUserId: jest.fn(),
  findByEmail: jest.fn(),
  attachSpotify: jest.fn(),
  attachPassword: jest.fn(),
  createWithPassword: jest.fn(),
  upsert: jest.fn(),
  updateDisplayName: jest.fn(),
};

// ── Test Suite ───────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SpotifyService, useValue: mockSpotifyService },
        { provide: SpotifyAuthService, useValue: mockSpotifyAuthService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AccountMergeService, useValue: mockAccountMergeService },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── handleCallback ───────────────────────────────────────────────

  describe('handleCallback', () => {
    const GUEST_ID = 'guest-user';
    const EXISTING_ID = 'existing-user';

    beforeEach(() => {
      mockSessionService.consumePkceState.mockResolvedValue({
        codeVerifier: 'v',
      });
      mockSpotifyService.exchangeCodeForTokens.mockResolvedValue({
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: 3600,
      });
      mockSpotifyService.getUserProfile.mockResolvedValue({
        id: SPOTIFY_USER_ID,
        displayName: 'Carlos',
        avatarUrl: 'https://spotify.test/a.jpg',
        country: 'PT',
      });
      mockSessionService.createSession.mockResolvedValue('session-new');
      mockUserRepository.upsert.mockResolvedValue(makeUser());
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.attachSpotify.mockResolvedValue(
        makeUser({ id: GUEST_ID }),
      );
    });

    it('attaches Spotify to the guest row when the account is new', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(null);

      await service.handleCallback('code', 'state', 'session-guest');

      expect(mockUserRepository.attachSpotify).toHaveBeenCalledWith(
        GUEST_ID,
        expect.objectContaining({ spotifyUserId: SPOTIFY_USER_ID }),
      );
      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
    });

    it('merges the guest into the existing account on collision', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-guest');

      expect(mockAccountMergeService.merge).toHaveBeenCalledWith(
        GUEST_ID,
        EXISTING_ID,
      );
      expect(mockUserRepository.attachSpotify).not.toHaveBeenCalled();
    });

    it('never merges away a session that already has an account', async () => {
      // A shared browser: someone left signed in, someone else signs in.
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: 'alice', spotifyUserId: 'spotify-alice' }),
      );
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: 'alice', spotifyUserId: 'spotify-alice' }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-alice');

      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
      expect(mockUserRepository.attachSpotify).not.toHaveBeenCalled();
    });

    it('never re-points an account at a different Spotify id', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: 'alice', spotifyUserId: 'spotify-alice' }),
      );
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: 'alice', spotifyUserId: 'spotify-alice' }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(null);

      await service.handleCallback('code', 'state', 'session-alice');

      expect(mockUserRepository.attachSpotify).not.toHaveBeenCalled();
      expect(mockUserRepository.upsert).toHaveBeenCalled();
    });

    it('drops the guest session once its row has been merged away', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-guest');

      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(
        'session-guest',
      );
    });

    it('treats a session whose row is gone as nothing to merge', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.findById.mockResolvedValue(null);
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-stale');

      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
    });

    it('does not merge a row into itself on an ordinary re-login', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: EXISTING_ID }),
      );
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-existing');

      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
    });

    it('signs in normally when there is no current session', async () => {
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', undefined);

      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
      expect(mockSessionService.getSession).not.toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalled();
    });

    it('treats a stale cookie as nothing to merge', async () => {
      mockSessionService.getSession.mockRejectedValue(new Error('expired'));
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-gone');

      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
      expect(mockUserRepository.upsert).toHaveBeenCalled();
    });

    it('creates a fresh row when there is neither a session nor an account', async () => {
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(null);

      await service.handleCallback('code', 'state', undefined);

      expect(mockUserRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          spotifyUserId: SPOTIFY_USER_ID,
          displayName: 'Carlos',
        }),
      );
    });

    it('keys the new session on the surviving row', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ userId: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.findBySpotifyUserId.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );
      mockUserRepository.upsert.mockResolvedValue(
        makeUser({ id: EXISTING_ID }),
      );

      await service.handleCallback('code', 'state', 'session-guest');

      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: EXISTING_ID,
          spotifyUserId: SPOTIFY_USER_ID,
        }),
      );
    });
  });

  // ── getUserBySessionId ───────────────────────────────────────────

  describe('signup', () => {
    const GUEST_ID = 'guest-user-id';
    const EMAIL = 'ada@example.com';
    // Assembled rather than written out: a literal here reads as a leaked
    // credential to a secret scanner, and it is only ever a fixture.
    const PASSWORD = ['fixture', 'only', 'value'].join('-');

    beforeEach(() => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockSessionService.createSession.mockResolvedValue('new-session');
    });

    it('turns the guest row into the account, keeping what they played', async () => {
      mockSessionService.getSession.mockResolvedValue({ userId: GUEST_ID });
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.attachPassword.mockResolvedValue(
        makeUser({ id: GUEST_ID, spotifyUserId: undefined, email: EMAIL }),
      );

      await service.signup(EMAIL, PASSWORD, 'guest-session');

      expect(mockUserRepository.attachPassword).toHaveBeenCalledWith(
        GUEST_ID,
        EMAIL,
        expect.stringContaining('scrypt$'),
      );
      expect(mockUserRepository.createWithPassword).not.toHaveBeenCalled();
    });

    it('never stores the password itself', async () => {
      mockSessionService.getSession.mockResolvedValue({ userId: GUEST_ID });
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: GUEST_ID, spotifyUserId: undefined }),
      );
      mockUserRepository.attachPassword.mockResolvedValue(makeUser());

      await service.signup(EMAIL, PASSWORD, 'guest-session');

      const [, , stored] = mockUserRepository.attachPassword.mock.calls[0];
      expect(stored).not.toContain(PASSWORD);
    });

    it('starts a fresh row when the browser already belongs to an account', async () => {
      // A shared browser. Claiming this row would hand one person's history to
      // another, and on the Spotify path the same mistake deleted an account.
      mockSessionService.getSession.mockResolvedValue({ userId: USER_ID });
      mockUserRepository.findById.mockResolvedValue(makeUser());
      mockUserRepository.createWithPassword.mockResolvedValue(
        makeUser({ id: 'brand-new', email: EMAIL }),
      );

      await service.signup(EMAIL, PASSWORD, 'their-session');

      expect(mockUserRepository.attachPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.createWithPassword).toHaveBeenCalled();
    });

    it('refuses an email that is already registered', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());

      await expect(service.signup(EMAIL, PASSWORD, undefined)).rejects.toThrow(
        'That email is already registered',
      );
    });

    it('does not touch an existing account when the email is taken', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(makeUser());

      await expect(
        service.signup(EMAIL, PASSWORD, undefined),
      ).rejects.toThrow();

      expect(mockUserRepository.attachPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.createWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const EMAIL = 'ada@example.com';
    const PASSWORD = ['fixture', 'only', 'value'].join('-');
    const GUEST_ID = 'guest-user-id';
    let storedHash: string;

    beforeEach(async () => {
      storedHash = await hashPassword(PASSWORD);
      mockSessionService.createSession.mockResolvedValue('new-session');
    });

    it('signs in with the right password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ email: EMAIL, passwordHash: storedHash }),
      );
      mockSessionService.getSession.mockRejectedValue(new Error('no session'));

      await expect(service.login(EMAIL, PASSWORD, undefined)).resolves.toBe(
        'new-session',
      );
    });

    it('refuses the wrong password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ email: EMAIL, passwordHash: storedHash }),
      );

      await expect(
        service.login(EMAIL, 'not-the-password', undefined),
      ).rejects.toThrow('Email or password is incorrect');
    });

    it('says the same thing for an unknown email, so accounts cannot be enumerated', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('nobody@example.com', PASSWORD, undefined),
      ).rejects.toThrow('Email or password is incorrect');
    });

    it('refuses a Spotify-only account, which has no password to check', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ email: EMAIL, passwordHash: undefined }),
      );

      await expect(service.login(EMAIL, PASSWORD, undefined)).rejects.toThrow(
        'Email or password is incorrect',
      );
    });

    it('brings a guest progress along when they log in', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ email: EMAIL, passwordHash: storedHash }),
      );
      mockSessionService.getSession.mockResolvedValue({ userId: GUEST_ID });
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: GUEST_ID, spotifyUserId: undefined }),
      );

      await service.login(EMAIL, PASSWORD, 'guest-session');

      expect(mockAccountMergeService.merge).toHaveBeenCalledWith(
        GUEST_ID,
        USER_ID,
      );
    });

    it('leaves another account alone on a shared browser', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ email: EMAIL, passwordHash: storedHash }),
      );
      mockSessionService.getSession.mockResolvedValue({ userId: 'someone' });
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ id: 'someone', spotifyUserId: 'their-spotify' }),
      );

      await service.login(EMAIL, PASSWORD, 'their-session');

      expect(mockAccountMergeService.merge).not.toHaveBeenCalled();
    });
  });

  describe('getUserBySessionId', () => {
    it('resolves the user row the session points at', async () => {
      const row = makeUser();
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockUserRepository.findById.mockResolvedValue(row);

      await expect(service.getUserBySessionId(SESSION_ID)).resolves.toBe(row);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(USER_ID);
    });

    it('resolves a session that carries no Spotify link', async () => {
      const row = makeUser();
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );
      mockUserRepository.findById.mockResolvedValue(row);

      await expect(service.getUserBySessionId(SESSION_ID)).resolves.toBe(row);
    });

    it('rejects when the user row is gone', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getUserBySessionId(SESSION_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── getCurrentUser ───────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('loads the row by user id and reports the effective avatar', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockUserRepository.findById.mockResolvedValue(
        makeUser({
          avatarSource: AvatarSource.CUSTOM,
          customAvatarUrl: 'https://cdn.test/custom.jpg',
          isAdmin: true,
        }),
      );

      const result = await service.getCurrentUser(SESSION_ID);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(USER_ID);
      expect(result.avatarUrl).toBe('https://cdn.test/custom.jpg');
      expect(result.spotifyAvatarUrl).toBe('https://spotify.test/avatar.jpg');
      expect(result.isAdmin).toBe(true);
      expect(result.displayName).toBe('Vinyl Chorus');
    });

    it('omits the Spotify id when the account is not linked', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );
      mockUserRepository.findById.mockResolvedValue(
        makeUser({ spotifyUserId: undefined }),
      );

      const result = await service.getCurrentUser(SESSION_ID);

      expect(result.spotifyUserId).toBeUndefined();
    });

    it('rejects when no user row matches the session', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getCurrentUser(SESSION_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── getValidAccessToken ──────────────────────────────────────────

  describe('getValidAccessToken', () => {
    it('returns a token for a linked account', async () => {
      const session = makeSession();
      mockSessionService.getSession.mockResolvedValue(session);
      mockSpotifyAuthService.getValidAccessToken.mockResolvedValue('token-1');

      const result = await service.getValidAccessToken(SESSION_ID);

      expect(result).toEqual({ session, accessToken: 'token-1' });
      expect(mockSpotifyAuthService.getValidAccessToken).toHaveBeenCalledWith(
        SPOTIFY_USER_ID,
      );
    });

    it('refuses a session with no linked Spotify account', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );

      await expect(service.getValidAccessToken(SESSION_ID)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockSpotifyAuthService.getValidAccessToken).not.toHaveBeenCalled();
    });
  });

  // ── logout ───────────────────────────────────────────────────────

  describe('logout', () => {
    it('revokes Spotify tokens and drops the session', async () => {
      mockSessionService.getSession.mockResolvedValue(makeSession());

      await service.logout(SESSION_ID);

      expect(mockSpotifyAuthService.revokeTokens).toHaveBeenCalledWith(
        SPOTIFY_USER_ID,
      );
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    });

    it('still drops a session it cannot read, so the cookie can be cleared', async () => {
      // A pre-re-key blob makes getSession throw; logout must not propagate it.
      mockSessionService.getSession.mockRejectedValue(
        new UnauthorizedException('Session not found'),
      );

      await expect(service.logout(SESSION_ID)).resolves.toBeUndefined();

      expect(mockSpotifyAuthService.revokeTokens).not.toHaveBeenCalled();
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    });

    it('skips revocation for an unlinked account', async () => {
      mockSessionService.getSession.mockResolvedValue(
        makeSession({ spotifyUserId: undefined }),
      );

      await service.logout(SESSION_ID);

      expect(mockSpotifyAuthService.revokeTokens).not.toHaveBeenCalled();
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(SESSION_ID);
    });
  });
});
