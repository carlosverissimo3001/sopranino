import { PlaylistSource } from '@prisma/client';
import { parsePlaylistLink } from './links';

const { DEEZER, SPOTIFY, APPLE_MUSIC } = PlaylistSource;

describe('parsePlaylistLink', () => {
  describe('Deezer', () => {
    it.each([
      'https://www.deezer.com/playlist/1313621735',
      'https://www.deezer.com/en/playlist/1313621735',
      'https://www.deezer.com/pt-br/playlist/1313621735?utm_source=deezer',
      'deezer.com/playlist/1313621735/',
      '  https://www.deezer.com/playlist/1313621735  ',
    ])('reads %s', (link) => {
      expect(parsePlaylistLink(DEEZER, link)).toEqual({
        externalId: '1313621735',
      });
    });

    it('leaves a short link to be followed', () => {
      expect(
        parsePlaylistLink(DEEZER, 'https://link.deezer.com/s/30abc'),
      ).toEqual({ shortUrl: 'https://link.deezer.com/s/30abc' });
    });

    it.each([
      'https://www.deezer.com/album/123',
      'https://www.deezer.com/playlist/abc',
      'https://evil.example/deezer.com/playlist/1',
      'https://deezer.com.evil.example/playlist/1',
      'https://link.deezer.com/',
      'not a link',
      'javascript:alert(1)',
      'ftp://deezer.com/playlist/1',
    ])('refuses %s', (link) => {
      expect(parsePlaylistLink(DEEZER, link)).toBeNull();
    });
  });

  describe('Spotify', () => {
    it.each([
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc',
      'https://open.spotify.com/intl-pt/playlist/37i9dQZF1DXcBWIGoYBM5M',
    ])('reads %s', (link) => {
      expect(parsePlaylistLink(SPOTIFY, link)).toEqual({
        externalId: '37i9dQZF1DXcBWIGoYBM5M',
      });
    });

    it('refuses a track link', () => {
      expect(
        parsePlaylistLink(
          SPOTIFY,
          'https://open.spotify.com/track/37i9dQZF1DXcBWIGoYBM5M',
        ),
      ).toBeNull();
    });
  });

  describe('Apple Music', () => {
    it.each([
      [
        'https://music.apple.com/us/playlist/todays-hits/pl.f4d106fed2bd41149aaacabb233eb5eb',
        'pl.f4d106fed2bd41149aaacabb233eb5eb',
      ],
      [
        'https://music.apple.com/pt/playlist/mine/pl.u-8aAVZAvCoP4K8x',
        'pl.u-8aAVZAvCoP4K8x',
      ],
      [
        'https://music.apple.com/pt/playlist/pl.u-8aAVZAvCoP4K8x',
        'pl.u-8aAVZAvCoP4K8x',
      ],
    ])('reads %s', (link, externalId) => {
      expect(parsePlaylistLink(APPLE_MUSIC, link)).toEqual({ externalId });
    });

    it('refuses an album link', () => {
      expect(
        parsePlaylistLink(
          APPLE_MUSIC,
          'https://music.apple.com/us/album/x/123',
        ),
      ).toBeNull();
    });
  });

  it('never reads one service as another', () => {
    expect(
      parsePlaylistLink(SPOTIFY, 'https://www.deezer.com/playlist/1313621735'),
    ).toBeNull();
  });
});
