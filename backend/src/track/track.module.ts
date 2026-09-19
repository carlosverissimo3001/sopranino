import { AuthModule } from '@auth/auth.module';
import { TrackService } from './services/track.service';
import { TrackRepository } from './repositories/track.repository';
import { LastfmService } from './services/lastfm.service';
import { TrackArtistsService } from './services/track-artists.service';
import { SpotifyModule } from '@spotify/spotify.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [AuthModule, SpotifyModule],
  providers: [
    TrackService,
    TrackRepository,
    LastfmService,
    TrackArtistsService,
  ],
  exports: [TrackService, TrackRepository, LastfmService, TrackArtistsService],
})
export class TrackModule {}
