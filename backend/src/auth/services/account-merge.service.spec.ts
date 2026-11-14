import { Test, TestingModule } from '@nestjs/testing';
import { GameMode } from '@prisma/client';
import { AccountMergeService } from './account-merge.service';
import { PrismaService } from '@prisma/prisma.service';

jest.mock('@transaction/transaction.store', () => ({
  ...jest.requireActual('@transaction/transaction.store'),
  getBasePrismaClient: () => ({
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn({}),
  }),
}));

// ── Constants ────────────────────────────────────────────────────────

const SOURCE = 'guest-user';
const SURVIVOR = 'spotify-user';

// ── Factories ────────────────────────────────────────────────────────

function makeStats(userId: string, overrides = {}) {
  return {
    userId,
    mode: GameMode.DAILY,
    currentStreak: 1,
    bestStreak: 1,
    totalGames: 1,
    totalWins: 1,
    roundDistribution: [1, 0, 0, 0, 0, 0, 0],
    lastWinDate: new Date('2026-01-01'),
    ...overrides,
  };
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockPrismaService = {
  user: { findUniqueOrThrow: jest.fn(), update: jest.fn(), delete: jest.fn() },
  stats: {
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  gameSession: { updateMany: jest.fn() },
  gauntletRun: { updateMany: jest.fn() },
  multiplayerRoom: { updateMany: jest.fn() },
  roomPlayer: { findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

// ── Tests ────────────────────────────────────────────────────────────

describe('AccountMergeService', () => {
  let service: AccountMergeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.roomPlayer.findMany.mockResolvedValue([]);
    mockPrismaService.user.findUniqueOrThrow.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          answeredQuestionIds: where.id === SOURCE ? ['q1'] : ['q2'],
          streakFreezes: where.id === SOURCE ? 99 : 2,
          isTrusted: where.id === SOURCE,
        }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountMergeService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();
    service = module.get(AccountMergeService);
  });

  it('sums totals and takes the higher streaks', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([
      makeStats(SOURCE, {
        totalGames: 6,
        totalWins: 5,
        currentStreak: 6,
        bestStreak: 6,
        roundDistribution: [1, 1, 1, 1, 1, 0, 0],
        lastWinDate: new Date('2026-02-01'),
      }),
      makeStats(SURVIVOR, {
        totalGames: 10,
        totalWins: 4,
        currentStreak: 2,
        bestStreak: 9,
        roundDistribution: [0, 2, 0, 1, 0, 1, 0],
        lastWinDate: new Date('2026-01-15'),
      }),
    ]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.stats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_mode: { userId: SURVIVOR, mode: GameMode.DAILY } },
        data: expect.objectContaining({
          totalGames: 16,
          totalWins: 9,
          currentStreak: 6,
          bestStreak: 9,
          roundDistribution: [1, 3, 1, 2, 1, 1, 0],
          lastWinDate: new Date('2026-02-01'),
        }),
      }),
    );
  });

  it('carries over a mode the survivor has never played', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([makeStats(SOURCE)]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.stats.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: SURVIVOR,
          mode: GameMode.DAILY,
        }),
      }),
    );
  });

  it('clears the source stats so the row can be deleted', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([makeStats(SOURCE)]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.stats.deleteMany).toHaveBeenCalledWith({
      where: { userId: SOURCE },
    });
  });

  it('never transfers isTrusted or streakFreezes from the source', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    const update = mockPrismaService.user.update.mock.calls.find(
      ([arg]) => arg.where.id === SURVIVOR,
    );
    expect(update[0].data).not.toHaveProperty('isTrusted');
    expect(update[0].data).not.toHaveProperty('streakFreezes');
  });

  it('unions the answered question ids', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    const update = mockPrismaService.user.update.mock.calls.find(
      ([arg]) => arg.where.id === SURVIVOR,
    );
    expect(update[0].data.answeredQuestionIds.sort()).toEqual(['q1', 'q2']);
  });

  it('drops a room membership the survivor already has', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);
    mockPrismaService.roomPlayer.findMany.mockImplementation(
      ({ where }: { where: { userId: string } }) =>
        Promise.resolve(
          where.userId === SOURCE
            ? [{ id: 'rp-1', roomId: 'room-1', userId: SOURCE }]
            : [{ id: 'rp-2', roomId: 'room-1', userId: SURVIVOR }],
        ),
    );

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.roomPlayer.delete).toHaveBeenCalledWith({
      where: { id: 'rp-1' },
    });
    expect(mockPrismaService.roomPlayer.update).not.toHaveBeenCalled();
  });

  it('moves a room membership the survivor does not have', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);
    mockPrismaService.roomPlayer.findMany.mockImplementation(
      ({ where }: { where: { userId: string } }) =>
        Promise.resolve(
          where.userId === SOURCE
            ? [{ id: 'rp-1', roomId: 'room-1', userId: SOURCE }]
            : [],
        ),
    );

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.roomPlayer.update).toHaveBeenCalledWith({
      where: { id: 'rp-1' },
      data: { userId: SURVIVOR },
    });
    expect(mockPrismaService.roomPlayer.delete).not.toHaveBeenCalled();
  });

  it('rehosts the rooms the source created', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.multiplayerRoom.updateMany).toHaveBeenCalledWith({
      where: { hostId: SOURCE },
      data: { hostId: SURVIVOR },
    });
  });

  it('reassigns game sessions and gauntlet runs', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.gameSession.updateMany).toHaveBeenCalledWith({
      where: { userId: SOURCE },
      data: { userId: SURVIVOR },
    });
    expect(mockPrismaService.gauntletRun.updateMany).toHaveBeenCalledWith({
      where: { userId: SOURCE },
      data: { userId: SURVIVOR },
    });
  });

  it('refuses to merge away a row that has an account', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);
    mockPrismaService.user.findUniqueOrThrow.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          answeredQuestionIds: [],
          spotifyUserId: where.id === SOURCE ? 'spotify-1' : 'spotify-2',
        }),
    );

    await expect(service.merge(SOURCE, SURVIVOR)).rejects.toThrow(
      'Cannot merge away an account',
    );
    expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
  });

  it('refuses to merge away a Google-only account', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);
    mockPrismaService.user.findUniqueOrThrow.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          answeredQuestionIds: [],
          googleUserId: where.id === SOURCE ? 'google-1' : null,
        }),
    );

    await expect(service.merge(SOURCE, SURVIVOR)).rejects.toThrow(
      'Cannot merge away an account',
    );
    expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
  });

  it('sums distributions over the longer of the two', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([
      makeStats(SOURCE, { roundDistribution: [1, 1, 1, 1, 1, 1, 1, 5] }),
      makeStats(SURVIVOR, { roundDistribution: [1, 0, 0, 0, 0, 0, 0] }),
    ]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.stats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roundDistribution: [2, 1, 1, 1, 1, 1, 1, 5],
        }),
      }),
    );
  });

  it('deletes the source row last', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
      where: { id: SOURCE },
    });
  });
});
