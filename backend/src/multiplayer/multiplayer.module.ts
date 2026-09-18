import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JOB_OPTIONS_WITH_BACKOFF, ROOM_CLEANUP_QUEUE } from '../consts';
import { AuthModule } from '../auth/auth.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { TrackModule } from '../track/track.module';
import { PoolModule } from '../pool/pool.module';
import { TrackGroupModule } from '../track-group/track-group.module';
import { MultiplayerController } from './controllers/multiplayer.controller';
import { RoomService } from './services/room.service';
import { MultiplayerGameService } from './services/multiplayer-game.service';
import { TrackPoolService } from './services/track-pool.service';
import { RoomRepository } from './repositories/room.repository';
import { MultiplayerGameSessionRepository } from './repositories/multiplayer-game-session.repository';
import { RoomsGateway } from './gateways/rooms.gateway';
import { RoomPresenceService } from './services/room-presence.service';
import { ChatService } from './services/chat.service';
import { RoomConsumer } from './consumers/room.consumer';

@Module({
  imports: [
    AuthModule,
    PlaylistModule,
    TrackModule,
    PoolModule,
    TrackGroupModule,
    BullModule.registerQueue({
      name: ROOM_CLEANUP_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  controllers: [MultiplayerController],
  providers: [
    RoomService,
    MultiplayerGameService,
    TrackPoolService,
    RoomRepository,
    MultiplayerGameSessionRepository,
    RoomsGateway,
    RoomPresenceService,
    ChatService,
    RoomConsumer,
  ],
  exports: [RoomService, MultiplayerGameService, RoomRepository],
})
export class MultiplayerModule {}
