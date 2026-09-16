import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PoolModule } from '../pool/pool.module';
import { TrackModule } from '../track/track.module';
import { TrackGroupController } from './controllers/track-group.controller';
import { TrackGroupRepository } from './repositories/track-group.repository';
import { TrackGroupService } from './services/track-group.service';

@Module({
  // Circular: the game module needs track groups, and this needs the session
  // behind a request to know whether a special group is for them.
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    forwardRef(() => TrackModule),
    PoolModule,
  ],
  controllers: [TrackGroupController],
  providers: [TrackGroupRepository, TrackGroupService],
  exports: [TrackGroupService, TrackGroupRepository],
})
export class TrackGroupModule {}
