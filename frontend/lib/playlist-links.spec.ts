import { detectPlaylistSource, PlaylistSource } from './playlist-links';

describe('detectPlaylistSource', () => {
  it.each([
    ['https://www.deezer.com/en/playlist/42', PlaylistSource.Deezer],
    ['deezer.com/playlist/42', PlaylistSource.Deezer],
    ['https://link.deezer.com/s/30abc', PlaylistSource.Deezer],
    [
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
      PlaylistSource.Spotify,
    ],
    ['https://music.apple.com/pt/playlist/x/pl.u-1', PlaylistSource.AppleMusic],
  ])('knows %s', (link, source) => {
    expect(detectPlaylistSource(link)).toBe(source);
  });

  it.each(['', '   ', 'road trip', 'https://evil.example/deezer.com'])(
    'knows nothing of %p',
    (link) => {
      expect(detectPlaylistSource(link)).toBeNull();
    },
  );
});
