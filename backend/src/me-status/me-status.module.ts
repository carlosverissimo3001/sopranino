import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreakModule } from '../streak/streak.module';
import { GameModule } from '../game/game.module';
import { GauntletModule } from '../gauntlet/gauntlet.module';
import { MeStatusController } from './controllers/me-status.controller';
import { MeStatusService } from './services/me-status.service';

@Module({
  imports: [AuthModule, StreakModule, GameModule, GauntletModule],
  controllers: [MeStatusController],
  providers: [MeStatusService],
})
export class MeStatusModule {}
