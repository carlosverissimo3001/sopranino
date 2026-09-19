import { PlaylistSource } from '@prisma/client';
import { parsePlaylistLink } from './links';

const { DEEZER } = PlaylistSource;

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

  // A link from a service we cannot read never reaches the server: the
  // player copies the playlist to Deezer and pastes that link instead.
  it('reads nothing for a service with no parser', () => {
    expect(
      parsePlaylistLink(
        PlaylistSource.SPOTIFY,
        'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      ),
    ).toBeNull();
  });
});
