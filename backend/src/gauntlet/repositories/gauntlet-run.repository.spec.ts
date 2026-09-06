import { Test, TestingModule } from '@nestjs/testing';
import {
  GauntletDifficulty,
  GauntletRunStatus,
  GauntletSource,
} from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { GauntletRunRepository } from './gauntlet-run.repository';

const prisma = {
  gauntletRun: { groupBy: jest.fn(), aggregate: jest.fn() },
  user: { findMany: jest.fn() },
};

describe('GauntletRunRepository and what the board is allowed to see', () => {
  let repository: GauntletRunRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.gauntletRun.groupBy.mockResolvedValue([]);
    prisma.gauntletRun.aggregate.mockResolvedValue({ _max: { score: null } });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GauntletRunRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = module.get(GauntletRunRepository);
  });

  const whereOf = (mock: jest.Mock) =>
    (mock.mock.calls[0][0] as { where: Record<string, unknown> }).where;

  it('ranks curated runs of one difficulty, and nothing else', async () => {
    await repository.findLeaderboardEntries(
      null,
      10,
      0,
      GauntletDifficulty.HARD,
    );

    expect(whereOf(prisma.gauntletRun.groupBy)).toEqual({
      status: GauntletRunStatus.ENDED,
      source: GauntletSource.CURATED,
      difficulty: GauntletDifficulty.HARD,
      score: { gt: 0 },
    });
  });

  it('applies the same rule when placing a player against the board', async () => {
    await repository.countUsersWithHigherScore(
      5,
      null,
      GauntletDifficulty.EXPERT,
    );

    expect(whereOf(prisma.gauntletRun.groupBy)).toMatchObject({
      source: GauntletSource.CURATED,
      difficulty: GauntletDifficulty.EXPERT,
    });
  });

  // A player's own best on the board has to be measured the way the board is,
  // or their rank would be computed against a score that never appears on it.
  it("measures a player's own best by the board's rule, not their whole history", async () => {
    await repository.findUserBestInPeriod(
      'user-1',
      null,
      GauntletDifficulty.EASY,
    );

    expect(whereOf(prisma.gauntletRun.aggregate)).toEqual({
      userId: 'user-1',
      status: GauntletRunStatus.ENDED,
      source: GauntletSource.CURATED,
      difficulty: GauntletDifficulty.EASY,
      score: { gt: 0 },
    });
  });

  // A run that scored nothing is not a placing, and the board would otherwise
  // crown whoever missed the first song when nobody else had played.
  it('leaves a scoreless run off the board', async () => {
    await repository.findLeaderboardEntries(
      null,
      10,
      0,
      GauntletDifficulty.MEDIUM,
    );

    expect(whereOf(prisma.gauntletRun.groupBy)).toMatchObject({
      score: { gt: 0 },
    });
  });

  it('narrows to the period without loosening the rule', async () => {
    const since = new Date('2026-09-01T00:00:00Z');

    await repository.findLeaderboardEntries(
      since,
      10,
      0,
      GauntletDifficulty.MEDIUM,
    );

    expect(whereOf(prisma.gauntletRun.groupBy)).toEqual({
      status: GauntletRunStatus.ENDED,
      source: GauntletSource.CURATED,
      difficulty: GauntletDifficulty.MEDIUM,
      score: { gt: 0 },
      completedAt: { gte: since },
    });
  });
});
