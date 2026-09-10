import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  MultiplayerRoom,
  RoomPlayer,
  RoomStatus,
  TrackSource,
  User,
} from '@prisma/client';
import { CreateRoomDto } from '../dto/create-room.dto';
import { Transactional } from '@transaction/transactional.decorator';

const PLAYERS_INCLUDE = {
  players: {
    include: {
      user: {
        select: { displayName: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
};

export type RoomWithPlayers = MultiplayerRoom & {
  players: (RoomPlayer & {
    user: Pick<User, 'displayName' | 'avatarUrl'>;
  })[];
};

@Injectable()
export class RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(room: CreateRoomDto): Promise<RoomWithPlayers> {
    return this.prisma.multiplayerRoom.create({
      data: {
        ...room,
        players: {
          create: { userId: room.hostId },
        },
      },
      include: PLAYERS_INCLUDE,
    });
  }

  async findFindableWaiting(limit: number): Promise<RoomWithPlayers[]> {
    return this.prisma.multiplayerRoom.findMany({
      where: { findable: true, status: RoomStatus.WAITING },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: PLAYERS_INCLUDE,
    });
  }

  async findById(id: string): Promise<RoomWithPlayers | null> {
    return this.prisma.multiplayerRoom.findUnique({
      where: { id },
      include: PLAYERS_INCLUDE,
    });
  }

  async findByInviteCode(inviteCode: string): Promise<RoomWithPlayers | null> {
    return this.prisma.multiplayerRoom.findUnique({
      where: { inviteCode },
      include: PLAYERS_INCLUDE,
    });
  }

  async findPlayerInRoom(
    roomId: string,
    userId: string,
  ): Promise<RoomPlayer | null> {
    return this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  }

  @Transactional()
  async claimSeat(
    roomId: string,
    userId: string,
    capacity: number,
  ): Promise<RoomPlayer | null> {
    await this.prisma
      .$queryRaw`SELECT id FROM multiplayer_rooms WHERE id = ${roomId} FOR UPDATE`;

    const taken = await this.prisma.roomPlayer.count({ where: { roomId } });
    if (taken >= capacity) {
      return null;
    }

    return this.prisma.roomPlayer.create({ data: { roomId, userId } });
  }

  async removePlayer(roomId: string, userId: string): Promise<void> {
    await this.prisma.roomPlayer.delete({
      where: { roomId_userId: { roomId, userId } },
    });
  }

  async updateStatus(
    roomId: string,
    status: RoomStatus,
    extra?: {
      startedAt?: Date;
      completedAt?: Date;
      trackIds?: string[];
    },
  ): Promise<RoomWithPlayers> {
    return this.prisma.multiplayerRoom.update({
      where: { id: roomId },
      data: { status, ...extra },
      include: PLAYERS_INCLUDE,
    });
  }

  async addToPlayerScore(playerId: string, score: number): Promise<void> {
    await this.prisma.roomPlayer.update({
      where: { id: playerId },
      data: { totalScore: { increment: score } },
    });
  }

  async setTrackSource(
    roomId: string,
    trackSource: TrackSource,
  ): Promise<RoomWithPlayers> {
    return this.prisma.multiplayerRoom.update({
      where: { id: roomId },
      data: { trackSource },
      include: PLAYERS_INCLUDE,
    });
  }

  async toggleReady(roomId: string, userId: string): Promise<RoomWithPlayers> {
    const player = await this.prisma.roomPlayer.findUniqueOrThrow({
      where: { roomId_userId: { roomId, userId } },
    });

    await this.prisma.roomPlayer.update({
      where: { id: player.id },
      data: { isReady: !player.isReady },
    });

    return this.prisma.multiplayerRoom.findUniqueOrThrow({
      where: { id: roomId },
      include: PLAYERS_INCLUDE,
    });
  }

  async inviteCodeExists(code: string): Promise<boolean> {
    const room = await this.prisma.multiplayerRoom.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    return !!room;
  }
}
