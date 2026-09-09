import { getClearCookieOptions, getCookieOptions } from './http-helpers';

describe('cookie options', () => {
  const env = process.env.COOKIE_DOMAIN;

  afterEach(() => {
    if (env === undefined) {
      delete process.env.COOKIE_DOMAIN;
    } else {
      process.env.COOKIE_DOMAIN = env;
    }
  });

  // localhost and 127.0.0.1 are separate hosts with no shared parent.
  it('leaves the cookie host-only when no domain is configured', () => {
    delete process.env.COOKIE_DOMAIN;

    expect(getCookieOptions({ sessionMaxAge: 60 }).domain).toBeUndefined();
  });

  it('scopes the cookie to the configured parent domain', () => {
    process.env.COOKIE_DOMAIN = '.sopranino.app';

    expect(getCookieOptions({ sessionMaxAge: 60 }).domain).toBe(
      '.sopranino.app',
    );
  });

  // Disagree here and signing out leaves the session cookie in place.
  it('clears with the same domain it sets', () => {
    process.env.COOKIE_DOMAIN = '.sopranino.app';

    expect(getClearCookieOptions().domain).toBe(
      getCookieOptions({ sessionMaxAge: 60 }).domain,
    );
  });

  it('clears host-only when it sets host-only', () => {
    delete process.env.COOKIE_DOMAIN;

    expect(getClearCookieOptions().domain).toBeUndefined();
  });

  // Express would take an empty string literally.
  it('treats an empty domain as unset', () => {
    process.env.COOKIE_DOMAIN = '';

    expect(getCookieOptions({ sessionMaxAge: 60 }).domain).toBeUndefined();
  });
});
