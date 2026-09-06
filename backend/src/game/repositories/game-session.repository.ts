import { Injectable } from '@nestjs/common';
import { startOfDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma, GameStatus, GameMode } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/client';
import { GuessHistoryDto } from '../dto/guess/guess-history.dto';
import { GameSessionEntity } from '../entities/game-session.entity';
import { FindGameSessionsDto } from '../dto/session/find-game-sessions.dto';
import { GAME_HISTORY_DEFAULT_PAGE_SIZE } from '../consts';
import { mapGameSession, PrismaGameSessionResult } from '../../utils/mappers';

@Injectable()
export class GameSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new game session (optionally inside a transaction).
   * @param data - The game session data to create
   */
  async createSession(
    data: Prisma.GameSessionCreateInput,
  ): Promise<GameSessionEntity> {
    const createdSession = await this.prisma.gameSession.create({ data });
    return mapGameSession(createdSession as PrismaGameSessionResult);
  }

  async findMany(
    where: Prisma.GameSessionWhereInput,
  ): Promise<GameSessionEntity[]> {
    const sessions = await this.prisma.gameSession.findMany({ where });
    return sessions.map((s) => mapGameSession(s as PrismaGameSessionResult));
  }

  /**
   * Finds a game session by its ID
   * @param id - The ID of the game session
   * @returns The GameSession if found, null otherwise
   */
  async findById(id: string): Promise<GameSessionEntity | null> {
    const gameSession = await this.prisma.gameSession.findUnique({
      where: { id },
    });
    return gameSession
      ? mapGameSession(gameSession as PrismaGameSessionResult)
      : null;
  }

  /**
   * Finds a game session by ID with its track relation in a single query.
   */
  async findByIdWithTrack(id: string): Promise<GameSessionEntity | null> {
    const result = await this.prisma.gameSession.findUnique({
      where: { id },
      include: { track: true },
    });
    if (!result) {
      return null;
    }
    return mapGameSession(result as PrismaGameSessionResult);
  }

  /**
   * Updates the progress of a game session
   * @param id - The ID of the game session to update
   * @param updateData - The data to update (currentRound, guesses, status, completedAt)
   * @returns The updated GameSession
   */
  async updateSessionProgress(
    id: string,
    updateData: {
      currentRound: number;
      guesses: GuessHistoryDto[];
      status: GameStatus;
      completedAt?: Date;
    },
  ): Promise<GameSessionEntity> {
    const updatedSession = await this.prisma.gameSession.update({
      where: { id },
      data: {
        currentRound: updateData.currentRound,
        guesses: updateData.guesses as unknown as InputJsonValue,
        status: updateData.status,
        completedAt: updateData.completedAt ?? null,
      },
    });
    return mapGameSession(updatedSession as PrismaGameSessionResult);
  }

  async updateMany(
    where: Prisma.GameSessionWhereInput,
    updateData: Partial<Prisma.GameSessionUpdateInput>,
  ): Promise<number> {
    const result = await this.prisma.gameSession.updateMany({
      where,
      data: updateData,
    });
    return result.count;
  }

  /**
   * Finds today's daily game session for a user (isDaily true, createdAt >= startOfToday).
   */
  async findTodayDailySession(
    userId: string,
    timezone: string,
  ): Promise<GameSessionEntity | null> {
    const today = startOfDay(new TZDate(new Date(), timezone));
    const session = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        mode: GameMode.DAILY,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });
    return session ? mapGameSession(session as PrismaGameSessionResult) : null;
  }

  /**
   * For a given user and mode, finds an active game session (status = PLAYING).
   * This is used to prevent starting multiple sessions at the same time.
   * @param userId - The ID of the user
   * @param mode - The game mode (e.g. DAILY, NORMAL)
   * @returns The active GameSession if found, null otherwise
   * */
  /**
   * Both ids are required rather than optional: Prisma drops an undefined
   * filter, which quietly turned this into "any active round in this mode" and
   * handed a player the round they left open somewhere else.
   */
  async findActiveSession(
    userId: string,
    mode: GameMode,
    playlistId: string,
    trackGroupId: string | null,
  ): Promise<GameSessionEntity | null> {
    const session = await this.prisma.gameSession.findFirst({
      where: {
        userId,
        mode,
        status: GameStatus.PLAYING,
        playlistId,
        trackGroupId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return session ? mapGameSession(session as PrismaGameSessionResult) : null;
  }

  /**
   * Finds game sessions for a user with optional filters and pagination.
   */
  async findUserGameSessions(
    params: FindGameSessionsDto,
  ): Promise<{ items: GameSessionEntity[]; total: number }> {
    const {
      userId,
      mode,
      onlyCompleted,
      limit = GAME_HISTORY_DEFAULT_PAGE_SIZE,
      page = 1,
      search,
      status,
      from,
      to,
    } = params;

    const where: Prisma.GameSessionWhereInput = { userId };
    if (mode) {
      where.mode = mode;
    }
    if (status?.length) {
      where.status = { in: status };
    }
    if (onlyCompleted) {
      where.completedAt = { not: null };
    }

    // Date range filter on completedAt
    if (from || to) {
      where.completedAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    // Search across track name, artist name, and album name
    if (search) {
      where.track = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { artistName: { contains: search, mode: 'insensitive' } },
          { albumName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.gameSession.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.gameSession.count({ where }),
    ]);

    return {
      items: items.map((s) => mapGameSession(s as PrismaGameSessionResult)),
      total,
    };
  }

  async markAsAbandoned(id: string): Promise<GameSessionEntity> {
    const updatedSession = await this.prisma.gameSession.update({
      where: { id },
      data: {
        status: GameStatus.ABANDONED,
        completedAt: new Date(),
      },
    });
    return mapGameSession(updatedSession as PrismaGameSessionResult);
  }
}
