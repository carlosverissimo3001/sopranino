import { authErrorMessage } from './auth-errors';

describe('authErrorMessage', () => {
  it('explains the Spotify allowlist', () => {
    expect(authErrorMessage('spotify_invite_only')).toMatch(/invited accounts/);
  });

  it('reads a cancelled consent as cancelled', () => {
    expect(authErrorMessage('access_denied')).toBe('Sign-in was cancelled.');
  });

  it('explains a Google account that belongs to another account', () => {
    expect(authErrorMessage('google_in_use')).toMatch(
      /already signs in to a different account/,
    );
  });

  // The query string is anyone's to write; it must never reach the page as-is.
  it('never shows an unknown code', () => {
    expect(authErrorMessage('<script>alert(1)</script>')).toBe(
      'Sign-in did not go through. Try again.',
    );
    expect(authErrorMessage('auth_failed')).toBe(
      'Sign-in did not go through. Try again.',
    );
  });
});
