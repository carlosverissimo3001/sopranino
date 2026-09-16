import { SessionGuard } from '@utils/guards/session-guard';
import { SignedUpGuard } from '@utils/guards/signed-up.guard';
import { SpotifyLinkedGuard } from '@utils/guards/spotify-linked.guard';
import { MyPlaylistsController } from './my-playlists.controller';

const guardsOn = (handler: keyof MyPlaylistsController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    MyPlaylistsController.prototype[handler],
  ) as unknown[]) ?? [];

describe('MyPlaylistsController guards', () => {
  // A player without Spotify still has imports to list.
  it('needs a finished sign-up, not Spotify', () => {
    expect(guardsOn('list')).toContain(SignedUpGuard);
    expect(guardsOn('list')).not.toContain(SpotifyLinkedGuard);
    expect(guardsOn('list')).not.toContain(SessionGuard);
  });
});
