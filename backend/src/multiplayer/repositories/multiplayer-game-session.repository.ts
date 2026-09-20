import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { GameMode, GameSession, GameStatus, Track, User } from '@prisma/client';
import { InputJsonValue } from '@prisma/client/runtime/client';
import { GuessHistoryDto } from '../../game/dto/guess/guess-history.dto';

export type SessionWithTrack = GameSession & { track: Track };

export type SessionWithTrackAndUser = GameSession & {
  track: Track;
  user: Pick<User, 'displayName' | 'avatarUrl'>;
};

@Injectable()
export class MultiplayerGameSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPlayerSessions(
    userId: string,
    roomId: string,
  ): Promise<SessionWithTrack[]> {
    return this.prisma.gameSession.findMany({
      where: { userId, multiplayerRoomId: roomId, mode: GameMode.MULTIPLAYER },
      orderBy: { createdAt: 'asc' },
      include: { track: true },
    });
  }

  async createSession(
    userId: string,
    roomId: string,
    trackId: string,
  ): Promise<SessionWithTrack> {
    return this.prisma.gameSession.create({
      data: {
        userId,
        playlistId: `multiplayer-${roomId}`,
        mode: GameMode.MULTIPLAYER,
        trackId,
        currentRound: 0,
        guesses: [],
        status: GameStatus.PLAYING,
        multiplayerRoomId: roomId,
      },
      include: { track: true },
    });
  }

  async findActiveSession(
    userId: string,
    roomId: string,
  ): Promise<SessionWithTrack | null> {
    return this.prisma.gameSession.findFirst({
      where: {
        userId,
        multiplayerRoomId: roomId,
        mode: GameMode.MULTIPLAYER,
        status: GameStatus.PLAYING,
      },
      include: { track: true },
    });
  }

  async updateSessionProgress(
    sessionId: string,
    data: {
      currentRound: number;
      guesses: GuessHistoryDto[];
      status: GameStatus;
      completedAt?: Date | null;
    },
  ): Promise<void> {
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        currentRound: data.currentRound,
        guesses: data.guesses as unknown as InputJsonValue,
        status: data.status,
        completedAt: data.completedAt ?? null,
      },
    });
  }

  async countCompletedByPlayer(roomId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.gameSession.groupBy({
      by: ['userId'],
      where: {
        multiplayerRoomId: roomId,
        mode: GameMode.MULTIPLAYER,
        status: { not: GameStatus.PLAYING },
      },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.userId, row._count._all]));
  }

  async findAllRoomSessions(
    roomId: string,
  ): Promise<SessionWithTrackAndUser[]> {
    return this.prisma.gameSession.findMany({
      where: { multiplayerRoomId: roomId, mode: GameMode.MULTIPLAYER },
      include: {
        track: true,
        user: { select: { displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
