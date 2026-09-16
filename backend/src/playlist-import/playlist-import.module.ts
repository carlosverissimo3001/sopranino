import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JOB_OPTIONS_WITH_BACKOFF, PLAYLIST_IMPORT_QUEUE } from '../consts';
import { PoolModule } from '../pool/pool.module';
import { RedisModule } from '../redis/redis.module';
import { PlaylistImportConsumer } from './consumers/playlist-import.consumer';
import { PlaylistImportController } from './controllers/playlist-import.controller';
import { MyPlaylistsController } from './controllers/my-playlists.controller';
import { MyPlaylistsService } from './services/my-playlists.service';
import { PlaylistModule } from '../playlist/playlist.module';
import { DeezerClient } from './providers/deezer/client';
import { DeezerMembersService } from './providers/deezer/members.service';
import { TrackGroupModule } from '../track-group/track-group.module';
import { DeezerProvider } from './providers/deezer/provider';
import { PLAYLIST_PROVIDERS } from './providers/playlist-provider';
import { PlaylistImportRepository } from './repositories/playlist-import.repository';
import { PlaylistImportService } from './services/playlist-import.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    PoolModule,
    TrackGroupModule,
    PlaylistModule,
    BullModule.registerQueue({
      name: PLAYLIST_IMPORT_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  controllers: [PlaylistImportController, MyPlaylistsController],
  providers: [
    DeezerClient,
    DeezerMembersService,
    DeezerProvider,
    {
      provide: PLAYLIST_PROVIDERS,
      useFactory: (deezer: DeezerProvider) => [deezer],
      inject: [DeezerProvider],
    },
    PlaylistImportRepository,
    PlaylistImportService,
    MyPlaylistsService,
    PlaylistImportConsumer,
  ],
  exports: [DeezerClient, DeezerMembersService],
})
export class PlaylistImportModule {}
