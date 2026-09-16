import { PlaylistUnavailableError } from '../playlist-provider';
import { DeezerProvider } from './provider';

describe('DeezerProvider', () => {
  const client = { playlist: jest.fn(), playlistTracks: jest.fn() };
  const members = { resolve: jest.fn() };
  const provider = new DeezerProvider(client as never, members as never);
  let fetchMock: jest.Mock;

  const redirectTo = (location: string | null) => ({
    headers: { get: () => location },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  describe('resolving a link', () => {
    it('reads a full link without fetching anything', async () => {
      await expect(
        provider.resolveId('https://www.deezer.com/en/playlist/42'),
      ).resolves.toBe('42');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('follows a short link one hop, without following redirects itself', async () => {
      fetchMock.mockResolvedValue(
        redirectTo('https://www.deezer.com/playlist/42?utm_source=share'),
      );

      await expect(
        provider.resolveId('https://link.deezer.com/s/30abc'),
      ).resolves.toBe('42');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://link.deezer.com/s/30abc',
        expect.objectContaining({ redirect: 'manual' }),
      );
    });

    // What link.deezer.com actually answers: its own page, with the playlist in `dest`.
    it('reads the playlist out of the landing page a short link redirects to', async () => {
      const dest = encodeURIComponent(
        'https://www.deezer.com/playlist/15761961641?host=1&utm_source=user_sharing',
      );
      fetchMock.mockResolvedValue(
        redirectTo(`https://link.deezer.com/?awf=${dest}&dest=${dest}`),
      );

      await expect(
        provider.resolveId('https://link.deezer.com/s/34q4AVpwJOJYCStpiK2YD'),
      ).resolves.toBe('15761961641');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('refuses a landing page whose dest is not a Deezer playlist', async () => {
      const dest = encodeURIComponent('https://evil.example/playlist/42');
      fetchMock.mockResolvedValue(
        redirectTo(`https://link.deezer.com/?dest=${dest}`),
      );

      await expect(
        provider.resolveId('https://link.deezer.com/s/30abc'),
      ).resolves.toBeNull();
    });

    // A short link is somewhere Deezer sends us, not somewhere a player points the server.
    it.each([
      'https://evil.example/playlist/42',
      'https://link.deezer.com/s/another',
      'https://www.deezer.com/album/42',
    ])('refuses a short link that lands on %s', async (location) => {
      fetchMock.mockResolvedValue(redirectTo(location));

      await expect(
        provider.resolveId('https://link.deezer.com/s/30abc'),
      ).resolves.toBeNull();
    });

    it('gives up on a short link that does not redirect', async () => {
      fetchMock.mockResolvedValue(redirectTo(null));

      await expect(
        provider.resolveId('https://link.deezer.com/s/30abc'),
      ).resolves.toBeNull();
    });
  });

  describe('reading a playlist', () => {
    it('calls a playlist Deezer answers with an error unavailable', async () => {
      client.playlist.mockResolvedValue({ ok: false, code: 800 });

      await expect(provider.info('42')).rejects.toThrow(
        PlaylistUnavailableError,
      );
    });

    it('calls a private playlist unavailable', async () => {
      client.playlist.mockResolvedValue({
        ok: true,
        body: { id: 42, title: 'Mine', public: false },
      });

      await expect(provider.info('42')).rejects.toThrow(
        PlaylistUnavailableError,
      );
    });

    // No answer at all is an outage, which the queue should retry.
    it('treats silence as an outage, not as a missing playlist', async () => {
      client.playlist.mockResolvedValue({ ok: false });

      await expect(provider.info('42')).rejects.not.toThrow(
        PlaylistUnavailableError,
      );
    });

    it('reports what the import needs', async () => {
      client.playlist.mockResolvedValue({
        ok: true,
        body: {
          id: 42,
          title: 'Road trip',
          checksum: 'abc',
          nb_tracks: 30,
          public: true,
          picture_xl: 'https://example.test/xl.jpg',
        },
      });

      await expect(provider.info('42')).resolves.toEqual({
        title: 'Road trip',
        imageUrl: 'https://example.test/xl.jpg',
        checksum: 'abc',
        trackCount: 30,
      });
    });
  });
});
