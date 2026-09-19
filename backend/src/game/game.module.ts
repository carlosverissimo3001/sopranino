import { Module } from '@nestjs/common';
import { GameController } from './controllers/game.controller';
import { GameService } from './services/game.service';
import { ChoiceService } from './services/choice.service';
import { GameSessionRepository } from './repositories/game-session.repository';
import { AuthModule } from '../auth/auth.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { SpotifyModule } from '../spotify/spotify.module';
import { TrackModule } from '../track/track.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { StreakModule } from '../streak/streak.module';
import { PoolModule } from '../pool/pool.module';
import { TrackGroupModule } from '../track-group/track-group.module';
import { DailyModule } from '../daily/daily.module';
import { ProvisioningSessionGuard } from '../utils/guards/provisioning-session.guard';
import { GameStatsModule } from './game-stats.module';
import { BullModule } from '@nestjs/bullmq';
import { GAME_CLEANUP_QUEUE, JOB_OPTIONS_WITH_BACKOFF } from '../consts';
import { GameConsumer } from './consumers/game.consumer';

@Module({
  imports: [
    AuthModule,
    PlaylistModule,
    SpotifyModule,
    TrackModule,
    UserPreferencesModule,
    StreakModule,
    PoolModule,
    DailyModule,
    TrackGroupModule,
    GameStatsModule,
    BullModule.registerQueue({
      name: GAME_CLEANUP_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  controllers: [GameController],
  providers: [
    GameService,
    ChoiceService,
    GameSessionRepository,
    GameConsumer,
    ProvisioningSessionGuard,
  ],
  exports: [GameService],
})
export class GameModule {}
