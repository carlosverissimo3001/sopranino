import { Injectable } from '@nestjs/common';
import { StreakService } from '../../streak/services/streak.service';
import { GameService } from '../../game/services/game.service';
import { GauntletService } from '../../gauntlet/services/gauntlet.service';
import { MeStatusDto } from '../dto/me-status.dto';

/** What the home page shows about the player, in one request instead of three. */
@Injectable()
export class MeStatusService {
  constructor(
    private readonly streakService: StreakService,
    private readonly gameService: GameService,
    private readonly gauntletService: GauntletService,
  ) {}

  async get(sessionId: string): Promise<MeStatusDto> {
    const [streak, daily, speedRun] = await Promise.all([
      this.streakService.getStreakStatus(sessionId),
      this.gameService.getPlayedToday(sessionId),
      this.gauntletService.getPersonalBest(sessionId),
    ]);
    return {
      streak,
      dailyPlayedToday: daily.playedToday,
      speedRunBest: speedRun.personalBest,
    };
  }
}
