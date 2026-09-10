import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { RoomStatus, TrackSource } from '@prisma/client';
import { LOBBY_MAX_ROOMS, ROOM_MAX_PLAYERS } from '../../consts';
import { AuthService } from '../../auth/services/auth.service';
import {
  RoomRepository,
  RoomWithPlayers,
} from '../repositories/room.repository';
import { RoomDto } from '../dto/room.dto';
import { OpenRoomDto } from '../dto/open-rooms.dto';
import { RoomPresenceService } from './room-presence.service';
import { CreateRoomControllerDto } from '../dto/create-room-controller.dto';
import { generateName } from '../../auth/utils/handle-generator';
import { TrackPoolService } from './track-pool.service';
import { RoomsGateway } from '../gateways/rooms.gateway';

const INVITE_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE_LENGTH = 8;
const MAX_INVITE_CODE_ATTEMPTS = 10;

@Injectable()
export class RoomService {
  constructor(
    private readonly authService: AuthService,
    private readonly roomRepository: RoomRepository,
    private readonly trackPoolService: TrackPoolService,
    private readonly presence: RoomPresenceService,
    @Inject(forwardRef(() => RoomsGateway))
    private readonly roomsGateway: RoomsGateway,
  ) {}

  /**
   * The lobby. Public, because somebody deciding whether to play should not
   * have to sign in to see whether anyone is waiting.
   *
   * Status alone is not enough: a room is WAITING from the moment it is made,
   * so anyone who opened the create screen and wandered off would sit in the
   * list for ever. Presence is what says a room still has somebody in it.
   */
  async listOpenRooms(): Promise<OpenRoomDto[]> {
    const rooms =
      await this.roomRepository.findFindableWaiting(LOBBY_MAX_ROOMS);

    const withPresence = await Promise.all(
      rooms.map(async (room) => ({
        room,
        online: (await this.presence.onlineUserIds(room.id)).length,
      })),
    );

    return withPresence
      .filter(
        ({ room, online }) =>
          online > 0 && room.players.length < ROOM_MAX_PLAYERS,
      )
      .map(({ room, online }) => ({
        id: room.id,
        name: room.name,
        playerCount: online,
        capacity: ROOM_MAX_PLAYERS,
        roundCount: room.roundCount,
        trackSource: room.trackSource,
      }));
  }

  async createRoom(
    sessionId: string,
    dto: CreateRoomControllerDto,
  ): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const inviteCode = await this.generateUniqueInviteCode();

    const room = await this.roomRepository.createRoom({
      hostId: userId,
      inviteCode,
      roundCount: dto.roundCount,
      name: generateName(),
      findable: dto.findable ?? true,
    });
    this.roomsGateway.lobbyChanged();

    return RoomDto.fromEntity(room);
  }

  /**
   * Members only. The room id is not a secret — it is in the url of everyone
   * who has ever played — while the invite code this returns is exactly the
   * thing that decides who gets in, alongside the roster and everyone's name.
   * The way into a room is the code, not the id.
   */
  async getRoomState(sessionId: string, roomId: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    if (!room.players.some((player) => player.userId === userId)) {
      throw new ForbiddenException('You are not in this room');
    }

    return RoomDto.fromEntity(room);
  }

  /** The way in when somebody sent you a code. */
  async joinRoom(sessionId: string, inviteCode: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const room = await this.roomRepository.findByInviteCode(
      inviteCode.toUpperCase(),
    );
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.seatPlayer(room, userId);
  }

  async joinFindableRoom(sessionId: string, roomId: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);

    const room = await this.roomRepository.findById(roomId);
    if (!room?.findable) {
      throw new NotFoundException('Room not found');
    }

    return this.seatPlayer(room, userId);
  }

  private async seatPlayer(
    room: RoomWithPlayers,
    userId: string,
  ): Promise<RoomDto> {
    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room is no longer accepting players');
    }

    const existingPlayer = await this.roomRepository.findPlayerInRoom(
      room.id,
      userId,
    );
    if (existingPlayer) {
      return RoomDto.fromEntity(room);
    }

    const seat = await this.roomRepository.claimSeat(
      room.id,
      userId,
      ROOM_MAX_PLAYERS,
    );
    if (!seat) {
      throw new BadRequestException(
        `This room is full (${ROOM_MAX_PLAYERS} players)`,
      );
    }

    const updated = await this.findRoomOrThrow(room.id);
    const dto = RoomDto.fromEntity(updated);
    this.roomsGateway.emitRoomUpdate(room.id, dto);
    return dto;
  }

  /**
   * The host chooses where the songs come from. Deliberately not inferred from
   * who is in the room, so it cannot change under them when someone joins.
   */
  async setTrackSource(
    sessionId: string,
    roomId: string,
    trackSource: TrackSource,
  ): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can change the song source');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('The game has already started');
    }

    const updated = await this.roomRepository.setTrackSource(
      roomId,
      trackSource,
    );
    const dto = RoomDto.fromEntity(updated);
    this.roomsGateway.emitRoomUpdate(roomId, dto);
    return dto;
  }

  async toggleReady(sessionId: string, roomId: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room is no longer in waiting state');
    }

    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isPlayer) {
      throw new BadRequestException('You are not in this room');
    }

    const updated = await this.roomRepository.toggleReady(roomId, userId);
    const dto = RoomDto.fromEntity(updated);
    this.roomsGateway.emitRoomUpdate(roomId, dto);
    return dto;
  }

  async startGame(sessionId: string, roomId: string): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can start the game');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Game has already started or completed');
    }

    if (!room.players.every((p) => p.isReady)) {
      throw new BadRequestException(
        'All players must be ready before starting',
      );
    }

    // Pool tracks from all players' liked songs
    const playerUserIds = room.players.map((p) => p.userId);
    let trackIds: string[];
    try {
      trackIds = await this.trackPoolService.selectTracksForRoom(
        playerUserIds,
        room.roundCount,
        room.trackSource,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message =
        error instanceof Error && error.message
          ? `Failed to select tracks for this room: ${error.message}`
          : 'Failed to select tracks for this room';
      throw new BadRequestException(message);
    }

    if (trackIds.length < room.roundCount) {
      throw new BadRequestException(
        `Not enough tracks to start the game (required: ${room.roundCount}, found: ${trackIds.length})`,
      );
    }

    const updated = await this.roomRepository.updateStatus(
      roomId,
      RoomStatus.PLAYING,
      {
        startedAt: new Date(),
        trackIds,
      },
    );

    const dto = RoomDto.fromEntity(updated);
    this.roomsGateway.emitRoomUpdate(roomId, dto);
    return dto;
  }

  async leaveRoom(sessionId: string, roomId: string): Promise<void> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isPlayer) {
      throw new BadRequestException('You are not in this room');
    }

    // If host leaves, expire the room
    if (room.hostId === userId) {
      const updated = await this.roomRepository.updateStatus(
        roomId,
        RoomStatus.EXPIRED,
      );
      this.roomsGateway.emitRoomUpdate(roomId, RoomDto.fromEntity(updated));
      return;
    }

    // Otherwise just remove the player
    await this.roomRepository.removePlayer(roomId, userId);
    const updated = await this.findRoomOrThrow(roomId);
    this.roomsGateway.emitRoomUpdate(roomId, RoomDto.fromEntity(updated));
  }

  /**
   * The host clears out someone who is not coming back. Not available once the
   * game is under way: by then they have a score, and removing them would
   * rewrite a game the others already played.
   */
  async kickPlayer(
    sessionId: string,
    roomId: string,
    targetUserId: string,
  ): Promise<RoomDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.findRoomOrThrow(roomId);

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only the host can remove players');
    }

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('The game has already started');
    }

    if (targetUserId === room.hostId) {
      throw new BadRequestException('The host cannot be removed');
    }

    if (!room.players.some((player) => player.userId === targetUserId)) {
      throw new NotFoundException('That player is not in this room');
    }

    await this.roomRepository.removePlayer(roomId, targetUserId);
    const updated = await this.findRoomOrThrow(roomId);
    const dto = RoomDto.fromEntity(updated);

    // Told directly, so their own tab stops pretending they are still in.
    this.roomsGateway.emitPlayerRemoved(roomId, targetUserId);
    this.roomsGateway.emitRoomUpdate(roomId, dto);
    return dto;
  }

  /**
   * Gives up the seat of someone whose grace period lapsed. Only in a lobby:
   * once a game is running, a player's rounds are part of it whether they are
   * watching or not, and completion already stops waiting on them.
   */
  async releaseSeat(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room || room.status !== RoomStatus.WAITING) {
      return;
    }

    if (!room.players.some((player) => player.userId === userId)) {
      return;
    }

    // The host leaving is the room ending, which leaveRoom already knows how
    // to do; a seat sweep should not quietly expire everyone else's lobby.
    if (room.hostId === userId) {
      return;
    }

    await this.roomRepository.removePlayer(roomId, userId);
    const updated = await this.roomRepository.findById(roomId);
    if (updated) {
      this.roomsGateway.emitRoomUpdate(roomId, RoomDto.fromEntity(updated));
    }
  }

  private async findRoomOrThrow(roomId: string): Promise<RoomWithPlayers> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let i = 0; i < MAX_INVITE_CODE_ATTEMPTS; i++) {
      const code = this.generateInviteCode();
      const exists = await this.roomRepository.inviteCodeExists(code);
      if (!exists) {
        return code;
      }
    }
    throw new Error('Failed to generate unique invite code');
  }

  private generateInviteCode(): string {
    let code = '';
    for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
      code += INVITE_CODE_CHARSET.charAt(
        Math.floor(Math.random() * INVITE_CODE_CHARSET.length),
      );
    }
    return code;
  }
}
