/**
 * Route gating in proxy.ts. The guest cases are the ones that matter: guest
 * play lives under /game, which is otherwise session-gated, so a careless
 * prefix match sends the signed-out visitor it exists for back to /.
 */

import { NextRequest } from 'next/server';
import { proxy } from './proxy';
import { getExpectedToken, signSpotifyReturnToken } from '@/lib/site-access';

function request(pathname: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(`https://unpaused.test${pathname}`));
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

const SESSION = { unpaused_session: 'a-session-id' };

describe('proxy route gating', () => {
  test('lets a signed out visitor reach guest play', async () => {
    const response = await proxy(request('/shuffle'));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  // Same bargain as guest play: the page is open, and starting a run is what
  // mints the session, so nothing is created by arriving.
  test('lets a signed out visitor reach the speed run', async () => {
    const response = await proxy(request('/speed-run'));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  test('lets a signed out visitor read the speed run leaderboard', async () => {
    const response = await proxy(request('/speed-run/leaderboard'));
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  test('sends a signed out visitor away from a playlist game', async () => {
    const response = await proxy(request('/playlist/some-playlist-id'));
    expect(response.headers.get('location')).toBe('https://unpaused.test/');
  });

  test('lets a signed in visitor reach a playlist game', async () => {
    const response = await proxy(
      request('/playlist/some-playlist-id', SESSION),
    );
    expect(response.status).toBe(200);
  });

  test.each(['/daily', '/history', '/preferences', '/admin'])(
    'gates %s on a session',
    async (pathname) => {
      const response = await proxy(request(pathname));
      expect(response.headers.get('location')).toBe('https://unpaused.test/');
    },
  );

  test('leaves the multiplayer join flow to handle sign in itself', async () => {
    const response = await proxy(request('/multiplayer/join/ABCD'));
    expect(response.status).toBe(200);
  });

  test('gates a multiplayer room on a session', async () => {
    const response = await proxy(request('/multiplayer/room-id'));
    expect(response.headers.get('location')).toBe('https://unpaused.test/');
  });
});

/**
 * The password gates Spotify sign in because of the five user cap, and the
 * people it stops by accident are the ones who have already been let through
 * it once.
 */
describe('the site password gate', () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    process.env.SITE_PASSWORD = 'the-site-password';
    process.env.PRIVATE_ZONE_PATH = '/a-secret-path';
    process.env.PRIVATE_ZONE_SPOTIFY_IDS =
      'a-listed-spotify-id, another-listed-id';
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  async function returnCookie(spotifyUserId: string) {
    const token = await signSpotifyReturnToken(spotifyUserId);
    return { 'spotify-return': token! };
  }

  async function accessCookie() {
    return { 'site-access': (await getExpectedToken())! };
  }

  test('turns away a visitor who has never had the password', async () => {
    const response = await proxy(request('/api/auth/login'));
    expect(response.headers.get('location')).toBe('https://unpaused.test/');
  });

  test('lets the password through', async () => {
    const response = await proxy(
      request('/api/auth/login', await accessCookie()),
    );
    expect(response.status).toBe(200);
  });

  test('lets a browser that has signed in with Spotify before through', async () => {
    const response = await proxy(
      request('/api/auth/login', await returnCookie('any-spotify-id')),
    );
    expect(response.status).toBe(200);
  });

  test('is not fooled by a made up mark', async () => {
    const response = await proxy(
      request('/api/auth/login', { 'spotify-return': 'aGVy.deadbeef' }),
    );
    expect(response.headers.get('location')).toBe('https://unpaused.test/');
  });

  test('sends a stranger to the gate rather than into the private zone', async () => {
    const response = await proxy(request('/a-secret-path', SESSION));
    expect(response.headers.get('location')).toBe(
      'https://unpaused.test/gate?next=%2Fa-secret-path',
    );
  });

  test('opens the private zone to a listed account', async () => {
    const response = await proxy(
      request('/a-secret-path', {
        ...SESSION,
        ...(await returnCookie('a-listed-spotify-id')),
      }),
    );
    expect(response.status).toBe(200);
  });

  test('keeps the private zone shut to an unlisted account', async () => {
    const response = await proxy(
      request('/a-secret-path', {
        ...SESSION,
        ...(await returnCookie('an-unlisted-spotify-id')),
      }),
    );
    expect(response.headers.get('location')).toContain('/gate');
  });

  test('keeps the private zone shut when no one is on the list', async () => {
    delete process.env.PRIVATE_ZONE_SPOTIFY_IDS;
    const response = await proxy(
      request('/a-secret-path', {
        ...SESSION,
        ...(await returnCookie('a-listed-spotify-id')),
      }),
    );
    expect(response.headers.get('location')).toContain('/gate');
  });
});
