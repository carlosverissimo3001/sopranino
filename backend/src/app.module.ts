import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionModule } from './transaction/transaction.module';
import { RedisModule } from './redis/redis.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { PlaylistModule } from './playlist/playlist.module';
import { SearchModule } from './search/search.module';
import { GameModule } from './game/game.module';
import { SpotifyModule } from './spotify/spotify.module';
import { AdminModule } from './admin/admin.module';
import { StreakModule } from './streak/streak.module';
import { ThrottleModule } from './throttle/throttle.module';
import { MultiplayerModule } from './multiplayer/multiplayer.module';
import { UserPreferencesModule } from './user-preferences/user-preferences.module';
import { UserAvatarModule } from './user-avatar/user-avatar.module';
import { GauntletModule } from './gauntlet/gauntlet.module';
import { DemoModule } from './demo/demo.module';
import { ChartModule } from './chart/chart.module';
import { TrackGroupModule } from './track-group/track-group.module';
import { BullModule } from '@nestjs/bullmq';
import { GAME_CLEANUP_QUEUE, JOB_OPTIONS_WITH_BACKOFF } from './consts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    PrismaModule,
    TransactionModule,
    RedisModule,
    EmailModule,
    ThrottleModule,
    AuthModule,
    PlaylistModule,
    GameModule,
    SearchModule,
    SpotifyModule,
    AdminModule,
    StreakModule,
    MultiplayerModule,
    UserPreferencesModule,
    UserAvatarModule,
    GauntletModule,
    DemoModule,
    ChartModule,
    TrackGroupModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: GAME_CLEANUP_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
})
export class AppModule {}
