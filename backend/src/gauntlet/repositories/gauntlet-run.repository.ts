import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  AvatarSource,
  GauntletDifficulty,
  GauntletEndReason,
  GauntletRunStatus,
  GauntletSource,
  Prisma,
} from '@prisma/client';
import { GauntletRunEntity } from '../entities/gauntlet-run.entity';
import { mapTrack } from '../../utils/mappers';

export interface LeaderboardEntryRaw {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  showStatsToOthers: boolean;
  /** Absent when the run drew on the whole pool rather than one group. */
  trackGroupName: string | null;
}

export interface GauntletHistorySummaryRaw {
  totalRuns: number;
  bestScore: number;
  averageScore: number;
  totalCorrectAnswers: number;
}

type PrismaGauntletRunResult = Prisma.GauntletRunGetPayload<{
  include: { currentTrack: true };
}>;

function toUndefinedIfNull<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

function fromPrisma(data: PrismaGauntletRunResult): GauntletRunEntity {
  return {
    id: data.id,
    userId: data.userId,
    score: data.score,
    status: data.status,
    difficulty: data.difficulty,
    endReason: toUndefinedIfNull(data.endReason),
    source: data.source,
    sourceId: toUndefinedIfNull(data.sourceId),
    trackIds: data.trackIds,
    currentTrackId: toUndefinedIfNull(data.currentTrackId),
    currentTrack: data.currentTrack ? mapTrack(data.currentTrack) : undefined,
    createdAt: data.createdAt,
    completedAt: toUndefinedIfNull(data.completedAt),
  };
}

function fromPrismaBasic(
  data: Prisma.GauntletRunGetPayload<object>,
): GauntletRunEntity {
  return {
    id: data.id,
    userId: data.userId,
    score: data.score,
    status: data.status,
    difficulty: data.difficulty,
    endReason: toUndefinedIfNull(data.endReason),
    source: data.source,
    sourceId: toUndefinedIfNull(data.sourceId),
    trackIds: data.trackIds,
    currentTrackId: toUndefinedIfNull(data.currentTrackId),
    createdAt: data.createdAt,
    completedAt: toUndefinedIfNull(data.completedAt),
  };
}

/**
 * What the global board is allowed to see. A playlist run is somebody's own
 * library, so it is not comparable with anyone else's and never ranks -
 * it stays in that player's history and personal best.
 *
 * A run that scored nothing is not a placing. Ranking it puts a crown on
 * somebody for missing the first song.
 */
function rankable(
  difficulty: GauntletDifficulty,
  startDate: Date | null,
): Prisma.GauntletRunWhereInput {
  return {
    status: GauntletRunStatus.ENDED,
    source: GauntletSource.CURATED,
    difficulty,
    score: { gt: 0 },
    ...(startDate && { completedAt: { gte: startDate } }),
  };
}

@Injectable()
export class GauntletRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    userId: string;
    difficulty: GauntletDifficulty;
    source: GauntletSource;
    sourceId: string | null;
  }): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.create({
      data: {
        user: { connect: { id: params.userId } },
        score: 0,
        status: GauntletRunStatus.PLAYING,
        difficulty: params.difficulty,
        source: params.source,
        sourceId: params.sourceId,
        trackIds: [],
      },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async findById(id: string): Promise<GauntletRunEntity | null> {
    const run = await this.prisma.gauntletRun.findUnique({
      where: { id },
      include: { currentTrack: true },
    });
    return run ? fromPrisma(run) : null;
  }

  async findActiveRun(userId: string): Promise<GauntletRunEntity | null> {
    const run = await this.prisma.gauntletRun.findFirst({
      where: { userId, status: GauntletRunStatus.PLAYING },
      orderBy: { createdAt: 'desc' },
      include: { currentTrack: true },
    });
    return run ? fromPrisma(run) : null;
  }

  async setCurrentTrack(
    runId: string,
    trackId: string,
    trackIds: string[],
  ): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.update({
      where: { id: runId },
      data: {
        currentTrack: { connect: { id: trackId } },
        trackIds,
      },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async incrementScore(runId: string): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.update({
      where: { id: runId },
      data: { score: { increment: 1 } },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async endRun(
    runId: string,
    reason: GauntletEndReason,
  ): Promise<GauntletRunEntity> {
    const run = await this.prisma.gauntletRun.update({
      where: { id: runId },
      data: {
        status: GauntletRunStatus.ENDED,
        endReason: reason,
        completedAt: new Date(),
      },
      include: { currentTrack: true },
    });
    return fromPrisma(run);
  }

  async findPersonalBest(userId: string): Promise<number> {
    const result = await this.prisma.gauntletRun.aggregate({
      where: { userId, status: GauntletRunStatus.ENDED },
      _max: { score: true },
    });
    return result._max.score ?? 0;
  }

  async findDailyBest(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const result = await this.prisma.gauntletRun.aggregate({
      where: {
        userId,
        status: GauntletRunStatus.ENDED,
        completedAt: { gte: startOfDay },
      },
      _max: { score: true },
    });
    return result._max.score ?? 0;
  }

  async findLeaderboardEntries(
    startDate: Date | null,
    limit: number,
    offset: number,
    difficulty: GauntletDifficulty,
  ): Promise<LeaderboardEntryRaw[]> {
    const grouped = await this.prisma.gauntletRun.groupBy({
      by: ['userId'],
      where: rankable(difficulty, startDate),
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: limit,
      skip: offset,
    });

    if (!grouped.length) {
      return [];
    }

    /**
     * groupBy keeps the best score and forgets which run set it, so the run
     * is fetched back by the pair. A player who tied their own best across
     * two groups is credited to whichever they reached first.
     */
    const bests = await this.prisma.gauntletRun.findMany({
      where: {
        ...rankable(difficulty, startDate),
        OR: grouped.map((row) => ({
          userId: row.userId,
          score: row._max.score ?? 0,
        })),
      },
      orderBy: { completedAt: 'asc' },
      select: { userId: true, sourceId: true },
    });

    // A curated run keeps its group in sourceId, with no relation to follow.
    const groupIdByUser = new Map<string, string | null>();
    for (const run of bests) {
      if (!groupIdByUser.has(run.userId)) {
        groupIdByUser.set(run.userId, run.sourceId);
      }
    }

    const groupIds = [...new Set([...groupIdByUser.values()])].filter(
      (id): id is string => id !== null,
    );
    const groups = groupIds.length
      ? await this.prisma.trackGroup.findMany({
          where: { id: { in: groupIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(groups.map((g) => [g.id, g.name]));

    const userIds = grouped.map((r) => r.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        customAvatarUrl: true,
        avatarSource: true,
        preferences: { select: { showStatsToOthers: true } },
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped.map((row) => {
      const user = userMap.get(row.userId);
      const effectiveAvatar =
        user?.avatarSource === AvatarSource.CUSTOM
          ? user.customAvatarUrl
          : user?.avatarUrl;
      return {
        userId: row.userId,
        displayName: user?.displayName ?? 'Unknown',
        avatarUrl: effectiveAvatar ?? null,
        score: row._max.score ?? 0,
        showStatsToOthers: user?.preferences?.showStatsToOthers ?? false,
        trackGroupName: (() => {
          const groupId = groupIdByUser.get(row.userId);
          return groupId ? (nameById.get(groupId) ?? null) : null;
        })(),
      };
    });
  }

  async countUsersWithHigherScore(
    score: number,
    startDate: Date | null,
    difficulty: GauntletDifficulty,
  ): Promise<number> {
    const rows = await this.prisma.gauntletRun.groupBy({
      by: ['userId'],
      where: rankable(difficulty, startDate),
      _max: { score: true },
      having: { score: { _max: { gt: score } } },
    });
    return rows.length;
  }

  async findUserBestInPeriod(
    userId: string,
    startDate: Date | null,
    difficulty: GauntletDifficulty,
  ): Promise<number | null> {
    const result = await this.prisma.gauntletRun.aggregate({
      where: { userId, ...rankable(difficulty, startDate) },
      _max: { score: true },
    });
    return result._max.score;
  }

  async findTopRuns(
    userId: string,
    limit: number,
  ): Promise<GauntletRunEntity[]> {
    const runs = await this.prisma.gauntletRun.findMany({
      where: { userId, status: GauntletRunStatus.ENDED },
      orderBy: { score: 'desc' },
      take: limit,
    });
    return runs.map(fromPrismaBasic);
  }

  async findUserHistory(params: {
    userId: string;
    limit: number;
    page: number;
    difficulty?: GauntletDifficulty;
  }): Promise<{ items: GauntletRunEntity[]; total: number }> {
    const { userId, limit, page, difficulty } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.GauntletRunWhereInput = {
      userId,
      status: GauntletRunStatus.ENDED,
      ...(difficulty && { difficulty }),
    };

    const [items, total] = await Promise.all([
      this.prisma.gauntletRun.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.gauntletRun.count({ where }),
    ]);

    return {
      items: items.map(fromPrismaBasic),
      total,
    };
  }

  async findUserHistorySummary(params: {
    userId: string;
    difficulty?: GauntletDifficulty;
  }): Promise<GauntletHistorySummaryRaw> {
    const { userId, difficulty } = params;

    const where: Prisma.GauntletRunWhereInput = {
      userId,
      status: GauntletRunStatus.ENDED,
      ...(difficulty && { difficulty }),
    };

    const aggregate = await this.prisma.gauntletRun.aggregate({
      where,
      _count: { _all: true },
      _max: { score: true },
      _avg: { score: true },
      _sum: { score: true },
    });

    return {
      totalRuns: aggregate._count._all,
      bestScore: aggregate._max.score ?? 0,
      averageScore: Number((aggregate._avg.score ?? 0).toFixed(1)),
      totalCorrectAnswers: aggregate._sum.score ?? 0,
    };
  }
}
