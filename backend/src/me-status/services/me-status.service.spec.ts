import { Test } from '@nestjs/testing';
import { StreakService } from '../../streak/services/streak.service';
import { GameService } from '../../game/services/game.service';
import { GauntletService } from '../../gauntlet/services/gauntlet.service';
import { MeStatusService } from './me-status.service';

const streak = { currentStreak: 4, playedToday: true, isTrusted: false };

describe('MeStatusService', () => {
  it('answers with all three, each under what it means', async () => {
    const module = await Test.createTestingModule({
      providers: [
        MeStatusService,
        {
          provide: StreakService,
          useValue: { getStreakStatus: jest.fn().mockResolvedValue(streak) },
        },
        {
          provide: GameService,
          useValue: {
            getPlayedToday: jest.fn().mockResolvedValue({ playedToday: false }),
          },
        },
        {
          provide: GauntletService,
          useValue: {
            getPersonalBest: jest.fn().mockResolvedValue({ personalBest: 42 }),
          },
        },
      ],
    }).compile();

    // A daily won today and one finished today are different questions.
    await expect(module.get(MeStatusService).get('session-1')).resolves.toEqual(
      { streak, dailyPlayedToday: false, speedRunBest: 42 },
    );
  });
});
