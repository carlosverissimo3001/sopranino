import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { GoogleAccountInUseError } from '../errors/google-account-in-use.error';
import { AvatarSource } from '@prisma/client';
import { GoogleAuthService } from './google-auth.service';
import { GoogleIdentity, GoogleService } from './google.service';
import { SessionService } from './session.service';
import { AccountMergeService } from './account-merge.service';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';

// ── Constants ────────────────────────────────────────────────────────

const GOOGLE_SUB = 'google-sub-1';
const EMAIL = 'player@example.com';
const GUEST_SESSION = 'guest-session';
const NEW_SESSION = 'new-session';

// ── Factories ────────────────────────────────────────────────────────

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    displayName: 'Vinyl Chorus',
    avatarSource: AvatarSource.SPOTIFY,
    isTrusted: false,
    isAdmin: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    streakFreezes: 0,
    answeredQuestionIds: [],
    ...overrides,
  };
}

function identity(overrides: Partial<GoogleIdentity> = {}): GoogleIdentity {
  return { sub: GOOGLE_SUB, email: EMAIL, emailVerified: true, ...overrides };
}

const guest = makeUser({ id: 'guest-1' });

// ── Mocks ────────────────────────────────────────────────────────────

const mockGoogle = { exchangeCode: jest.fn(), buildAuthUrl: jest.fn() };

const mockSessionService = {
  storePkceState: jest.fn(),
  consumePkceState: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  createSession: jest.fn(),
};

const mockUserRepository = {
  findById: jest.fn(),
  findByGoogleUserId: jest.fn(),
  findByEmail: jest.fn(),
  linkGoogle: jest.fn(),
  attachGoogle: jest.fn(),
  createWithGoogle: jest.fn(),
  setGoogleUserId: jest.fn(),
};

const mockAccountMerge = { merge: jest.fn(), absorbGoogleOnly: jest.fn() };

// ── Test Suite ───────────────────────────────────────────────────────

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        { provide: GoogleService, useValue: mockGoogle },
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AccountMergeService, useValue: mockAccountMerge },
      ],
    }).compile();

    service = module.get(GoogleAuthService);

    mockSessionService.consumePkceState.mockResolvedValue({
      codeVerifier: 'verifier',
      createdAt: Date.now(),
    });
    mockSessionService.createSession.mockResolvedValue(NEW_SESSION);
    mockGoogle.exchangeCode.mockResolvedValue(identity());
    mockUserRepository.findByGoogleUserId.mockResolvedValue(null);
    mockUserRepository.findByEmail.mockResolvedValue(null);
  });

  /** The browser is playing as `row`, signed in under GUEST_SESSION. */
  function playingAs(row: UserEntity) {
    mockSessionService.getSession.mockResolvedValue({ userId: row.id });
    mockUserRepository.findById.mockResolvedValue(row);
  }

  describe('startLogin', () => {
    it('stores the PKCE verifier under the state it hands back', async () => {
      mockGoogle.buildAuthUrl.mockReturnValue('https://accounts.google.test');

      const { authUrl, state } = await service.startLogin();

      expect(authUrl).toBe('https://accounts.google.test');
      // No account to link to: this is a sign-in.
      expect(mockSessionService.storePkceState).toHaveBeenCalledWith(
        state,
        expect.any(String),
        undefined,
      );
    });
  });

  describe('handleCallback', () => {
    it('signs a returning Google user into their account', async () => {
      const account = makeUser({ googleUserId: GOOGLE_SUB, email: EMAIL });
      mockUserRepository.findByGoogleUserId.mockResolvedValue(account);

      const result = await service.handleCallback('code', 'state');

      expect(result).toEqual({ linked: false, sessionId: NEW_SESSION });
      expect(mockUserRepository.linkGoogle).not.toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: account.id,
          googleUserId: GOOGLE_SUB,
        }),
      );
    });

    it('links Google to the account holding the verified address', async () => {
      const account = makeUser({ email: EMAIL, passwordHash: 'hash' });
      const linked = { ...account, googleUserId: GOOGLE_SUB };
      mockUserRepository.findByEmail.mockResolvedValue(account);
      mockUserRepository.linkGoogle.mockResolvedValue(linked);

      await service.handleCallback('code', 'state');

      expect(mockUserRepository.linkGoogle).toHaveBeenCalledWith(
        account.id,
        GOOGLE_SUB,
      );
      expect(mockUserRepository.createWithGoogle).not.toHaveBeenCalled();
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ userId: account.id }),
      );
    });

    it('never links by an address Google has not verified', async () => {
      mockGoogle.exchangeCode.mockResolvedValue(
        identity({ emailVerified: false }),
      );
      mockUserRepository.createWithGoogle.mockResolvedValue(
        makeUser({ id: 'fresh', googleUserId: GOOGLE_SUB }),
      );

      await service.handleCallback('code', 'state');

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
      expect(mockUserRepository.linkGoogle).not.toHaveBeenCalled();
      // Nor is the unproved address stored on the new row.
      expect(mockUserRepository.createWithGoogle).toHaveBeenCalledWith(
        GOOGLE_SUB,
        expect.any(String),
        undefined,
      );
    });

    it('refuses an address already linked to another Google account', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(
        makeUser({ email: EMAIL, googleUserId: 'someone-else' }),
      );

      await expect(service.handleCallback('code', 'state')).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.linkGoogle).not.toHaveBeenCalled();
      expect(mockSessionService.createSession).not.toHaveBeenCalled();
    });

    it('turns the guest row into the account when Google is new', async () => {
      playingAs(guest);
      mockUserRepository.attachGoogle.mockResolvedValue({
        ...guest,
        googleUserId: GOOGLE_SUB,
        email: EMAIL,
      });

      await service.handleCallback('code', 'state', GUEST_SESSION);

      expect(mockUserRepository.attachGoogle).toHaveBeenCalledWith(
        guest.id,
        GOOGLE_SUB,
        EMAIL,
      );
      expect(mockAccountMerge.merge).not.toHaveBeenCalled();
    });

    it('merges the guest into the existing account and drops its session', async () => {
      const account = makeUser({ googleUserId: GOOGLE_SUB });
      mockUserRepository.findByGoogleUserId.mockResolvedValue(account);
      playingAs(guest);

      await service.handleCallback('code', 'state', GUEST_SESSION);

      expect(mockAccountMerge.merge).toHaveBeenCalledWith(guest.id, account.id);
      expect(mockSessionService.deleteSession).toHaveBeenCalledWith(
        GUEST_SESSION,
      );
    });

    it('never merges away an account left signed in on a shared browser', async () => {
      const other = makeUser({ id: 'other', spotifyUserId: 'spotify-other' });
      playingAs(other);
      mockUserRepository.createWithGoogle.mockResolvedValue(
        makeUser({ id: 'fresh', googleUserId: GOOGLE_SUB }),
      );

      await service.handleCallback('code', 'state', 'other-session');

      expect(mockAccountMerge.merge).not.toHaveBeenCalled();
      expect(mockUserRepository.attachGoogle).not.toHaveBeenCalled();
      expect(mockUserRepository.createWithGoogle).toHaveBeenCalled();
    });

    it('treats a stale cookie as nothing to merge', async () => {
      mockSessionService.getSession.mockRejectedValue(new Error('expired'));
      mockUserRepository.createWithGoogle.mockResolvedValue(
        makeUser({ id: 'fresh', googleUserId: GOOGLE_SUB }),
      );

      await service.handleCallback('code', 'state', 'stale');

      expect(mockAccountMerge.merge).not.toHaveBeenCalled();
      expect(mockUserRepository.createWithGoogle).toHaveBeenCalledWith(
        GOOGLE_SUB,
        expect.any(String),
        EMAIL,
      );
    });

    it('does not merge an account into itself on an ordinary re-login', async () => {
      const account = makeUser({ googleUserId: GOOGLE_SUB });
      mockUserRepository.findByGoogleUserId.mockResolvedValue(account);
      playingAs(account);

      await service.handleCallback('code', 'state', GUEST_SESSION);

      expect(mockAccountMerge.merge).not.toHaveBeenCalled();
      expect(mockSessionService.deleteSession).not.toHaveBeenCalled();
    });
  });

  describe('linking', () => {
    const account = makeUser({ id: 'account-1', email: EMAIL });

    function linkStartedBy(userId: string) {
      mockSessionService.consumePkceState.mockResolvedValue({
        codeVerifier: 'verifier',
        createdAt: Date.now(),
        linkUserId: userId,
      });
    }

    it('refuses to start for a guest, who should sign in instead', async () => {
      playingAs(guest);

      await expect(service.startLink(GUEST_SESSION)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockSessionService.storePkceState).not.toHaveBeenCalled();
    });

    it('remembers which account started the link', async () => {
      playingAs(account);

      await service.startLink('account-session');

      expect(mockSessionService.storePkceState).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        account.id,
      );
    });

    it('adds Google to the signed-in account and keeps the session', async () => {
      linkStartedBy(account.id);
      playingAs(account);

      const result = await service.handleCallback(
        'code',
        'state',
        'account-session',
      );

      expect(result).toEqual({ linked: true });
      expect(mockUserRepository.setGoogleUserId).toHaveBeenCalledWith(
        account.id,
        GOOGLE_SUB,
      );
      expect(mockSessionService.createSession).not.toHaveBeenCalled();
      expect(mockAccountMerge.merge).not.toHaveBeenCalled();
    });

    it('folds in an account that only Google opens, instead of refusing', async () => {
      // Signed in with Google before linking it: a second, Google-only account.
      const googleOnly = makeUser({
        id: 'google-only',
        googleUserId: GOOGLE_SUB,
        email: EMAIL,
        emailVerifiedAt: new Date(),
      });
      const spotifyAccount = makeUser({ id: 'spotify-1', spotifyUserId: 'sp' });
      linkStartedBy(spotifyAccount.id);
      playingAs(spotifyAccount);
      mockUserRepository.findByGoogleUserId.mockResolvedValue(googleOnly);

      const result = await service.handleCallback(
        'code',
        'state',
        'account-session',
      );

      expect(result).toEqual({ linked: true });
      expect(mockAccountMerge.absorbGoogleOnly).toHaveBeenCalledWith(
        googleOnly.id,
        spotifyAccount.id,
      );
      expect(mockUserRepository.setGoogleUserId).not.toHaveBeenCalled();
    });

    it.each([
      ['Spotify', { spotifyUserId: 'spotify-other' }],
      ['a password', { passwordHash: 'hash' }],
    ])(
      'refuses a Google account whose account also opens with %s',
      async (_, credential) => {
        linkStartedBy(account.id);
        playingAs(account);
        mockUserRepository.findByGoogleUserId.mockResolvedValue(
          makeUser({
            id: 'someone-else',
            googleUserId: GOOGLE_SUB,
            ...credential,
          }),
        );

        await expect(
          service.handleCallback('code', 'state', 'account-session'),
        ).rejects.toThrow(GoogleAccountInUseError);
        expect(mockUserRepository.setGoogleUserId).not.toHaveBeenCalled();
        expect(mockAccountMerge.absorbGoogleOnly).not.toHaveBeenCalled();
      },
    );

    it('refuses when the browser is no longer signed in to that account', async () => {
      linkStartedBy(account.id);
      playingAs(makeUser({ id: 'someone-else', email: 'x@example.com' }));

      await expect(
        service.handleCallback('code', 'state', 'other-session'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUserRepository.setGoogleUserId).not.toHaveBeenCalled();
    });

    it('never swaps out a Google account already linked', async () => {
      const linked = { ...account, googleUserId: 'old-google' };
      linkStartedBy(account.id);
      playingAs(linked);

      await expect(
        service.handleCallback('code', 'state', 'account-session'),
      ).rejects.toThrow(ConflictException);
      expect(mockUserRepository.setGoogleUserId).not.toHaveBeenCalled();
    });
  });
});
