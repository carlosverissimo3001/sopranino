import {
  Inject,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import { AuthService } from '../../auth/services/auth.service';
import { SessionService } from '../../auth/services/session.service';
import { RoomRepository } from '../repositories/room.repository';
import { RoomPresenceService } from '../services/room-presence.service';
import { MultiplayerGameService } from '../services/multiplayer-game.service';
import { RoomService } from '../services/room.service';
import { RoomDto } from '../dto/room.dto';
import {
  LOBBY_BROADCAST_DEBOUNCE_MS,
  LOBBY_ROOM,
  ROOM_HOST_GONE_GRACE_MS,
  ROOM_PLAYER_GONE_GRACE_MS,
  ROOM_SWEEP_INTERVAL_MS,
  SESSION_COOKIE_NAME,
} from '../../consts';

@WebSocketGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },
})
export class RoomsGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomsGateway.name);

  private sweepTimer?: ReturnType<typeof setInterval>;

  /** Pending coalesced lobby broadcast, if a change has been announced. */
  private lobbyTimer?: ReturnType<typeof setTimeout>;

  /**
   * roomId -> the online set this instance last broadcast, so a heartbeat only
   * emits when the room actually changed. Purely a cache: losing it on restart
   * costs one redundant emit, never a missed one.
   */
  private readonly lastBroadcast = new Map<string, string>();

  constructor(
    private readonly sessionService: SessionService,
    private readonly authService: AuthService,
    private readonly roomRepository: RoomRepository,
    private readonly presence: RoomPresenceService,
    // The game service emits through this gateway, so the two refer to each
    // other; forwardRef is what lets Nest build the pair.
    @Inject(forwardRef(() => MultiplayerGameService))
    private readonly gameService: MultiplayerGameService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  onModuleInit(): void {
    // Every instance sweeps; the claim inside makes each room announce once.
    this.sweepTimer = setInterval(() => {
      void this.sweepHostGraces();
    }, ROOM_SWEEP_INTERVAL_MS);
    this.sweepTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.lobbyTimer) {
      clearTimeout(this.lobbyTimer);
    }
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const cookieHeader = client.handshake.headers.cookie;
      if (!cookieHeader) {
        client.disconnect();
        return;
      }

      const cookies = parseCookie(cookieHeader);
      const sessionId = cookies[SESSION_COOKIE_NAME];
      if (!sessionId) {
        client.disconnect();
        return;
      }

      // Validate session exists. Any player with a session may hold a socket,
      // account or not — room membership is what the joinRoom handler checks.
      await this.sessionService.getSession(sessionId);

      // Resolve user
      const user = await this.authService.getUserBySessionId(sessionId);

      client.data.userId = user.id;
      client.data.sessionId = sessionId;

      this.logger.debug(`Client connected: ${client.id} (user ${user.id})`);
      client.emit('authenticated');
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.data.userId as string | undefined;
    const roomIds = (client.data.roomIds as Set<string>) ?? new Set<string>();

    if (userId) {
      for (const roomId of roomIds) {
        await this.presence.leave(roomId, userId);
        await this.emitPresenceUpdate(roomId);

        // A refresh looks exactly like this, so the seat is only forfeit once
        // enough time has passed that it cannot have been one.
        await this.presence.startPlayerGrace(
          roomId,
          userId,
          Date.now() + ROOM_PLAYER_GONE_GRACE_MS,
        );

        try {
          const room = await this.roomRepository.findById(roomId);
          if (
            room &&
            room.hostId === userId &&
            (room.status === 'WAITING' || room.status === 'PLAYING')
          ) {
            // A grace period, so a refresh does not read as the host leaving.
            await this.presence.startHostGrace(
              roomId,
              Date.now() + ROOM_HOST_GONE_GRACE_MS,
            );
          }
        } catch {
          /* room may already be deleted */
        }
      }
    }

    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId || !payload.roomId) {
      return;
    }

    // Validate user is a member of the room
    const player = await this.roomRepository.findPlayerInRoom(
      payload.roomId,
      userId,
    );
    if (!player) {
      return;
    }

    await client.join(payload.roomId);

    if (!client.data.roomIds) {
      client.data.roomIds = new Set<string>();
    }
    (client.data.roomIds as Set<string>).add(payload.roomId);

    await this.presence.join(payload.roomId, userId);
    await this.presence.cancelPlayerGrace(payload.roomId, userId);
    await this.emitPresenceUpdate(payload.roomId);

    // Cancel a pending host-disconnect countdown if the host is reconnecting
    const room = await this.roomRepository.findById(payload.roomId);
    if (room && room.hostId === userId) {
      // Either the countdown is still running, or it already fired and the room
      // is sitting on a "host disconnected" it needs taking back.
      const wasPending = await this.presence.cancelHostGrace(payload.roomId);
      const wasAnnounced = await this.presence.clearHostAnnounced(
        payload.roomId,
      );
      if (wasPending || wasAnnounced) {
        this.server
          .to(payload.roomId)
          .emit('hostReconnected', { roomId: payload.roomId });
        this.logger.debug(
          `Host reconnected, cancelled disconnect timer for room ${payload.roomId}`,
        );
      }
    }

    this.logger.debug(`Client ${client.id} joined room ${payload.roomId}`);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): Promise<void> {
    if (!payload.roomId) {
      return;
    }
    await client.leave(payload.roomId);

    const userId = client.data.userId as string | undefined;
    if (userId) {
      (client.data.roomIds as Set<string> | undefined)?.delete(payload.roomId);
      await this.presence.leave(payload.roomId, userId);
      await this.emitPresenceUpdate(payload.roomId);
    }

    this.logger.debug(`Client ${client.id} left room ${payload.roomId}`);
  }

  /**
   * Keeps the member entry fresh. Without it the heartbeat lapses and the room
   * drops them, which is what should happen to a dead instance members and not
   * to a live one.
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket): Promise<void> {
    const userId = client.data.userId as string | undefined;
    const roomIds = (client.data.roomIds as Set<string>) ?? new Set<string>();
    if (!userId) {
      return;
    }

    for (const roomId of roomIds) {
      await this.presence.join(roomId, userId);
      // A member lost with their instance produces no disconnect event, so the
      // survivors only learn they are gone when someone next reads presence.
      await this.emitPresenceUpdate(roomId, { onlyIfChanged: true });
    }
  }

  private async sweepHostGraces(): Promise<void> {
    try {
      const roomIds = await this.presence.claimLapsedHostGraces();
      for (const roomId of roomIds) {
        await this.presence.markHostAnnounced(roomId);
        this.server.to(roomId).emit('hostDisconnected', { roomId });
        this.logger.debug(`Host disconnect emitted for room ${roomId}`);
      }
    } catch (err) {
      this.logger.error(
        'host-disconnect sweep failed',
        err instanceof Error ? err.stack : String(err),
      );
    }

    try {
      const seats = await this.presence.claimForfeitedSeats();
      for (const { roomId, userId } of seats) {
        await this.roomService.releaseSeat(roomId, userId);
        this.logger.debug(`Released seat of ${userId} in room ${roomId}`);
      }
    } catch (err) {
      this.logger.error(
        'seat sweep failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async emitPresenceUpdate(
    roomId: string,
    { onlyIfChanged = false }: { onlyIfChanged?: boolean } = {},
  ): Promise<void> {
    try {
      const onlineUserIds = await this.presence.onlineUserIds(roomId);

      const signature = [...onlineUserIds].sort().join(',');
      const previous = this.lastBroadcast.get(roomId);
      const shrank =
        previous !== undefined &&
        previous.split(',').length > onlineUserIds.length;
      if (onlyIfChanged && this.lastBroadcast.get(roomId) === signature) {
        return;
      }
      // An empty room is over, so drop its entry rather than grow the map.
      if (onlineUserIds.length) {
        this.lastBroadcast.set(roomId, signature);
      } else {
        this.lastBroadcast.delete(roomId);
      }

      this.server.to(roomId).emit('presenceUpdate', { roomId, onlineUserIds });
      this.lobbyChanged();

      // Someone left: whoever is still here may now be the last to finish.
      if (shrank) {
        await this.gameService.reconcileCompletion(roomId);
      }
    } catch (err) {
      this.logger.error(
        `emitPresenceUpdate failed for room ${roomId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /** Tells one player they are out, so their tab can act on it. */
  emitPlayerRemoved(roomId: string, userId: string): void {
    try {
      this.server.to(roomId).emit('playerRemoved', { roomId, userId });
    } catch (err) {
      this.logger.error(
        `emitPlayerRemoved failed for room ${roomId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /**
   * Something a browser would notice has changed. The list is rebuilt and sent
   * once per tick rather than per change: a room filling fires join, ready,
   * ready and start within a second, and each would otherwise be a broadcast
   * and a re-render for everyone watching.
   */
  lobbyChanged(): void {
    if (this.lobbyTimer) {
      return;
    }
    this.lobbyTimer = setTimeout(() => {
      this.lobbyTimer = undefined;
      void this.broadcastLobby();
    }, LOBBY_BROADCAST_DEBOUNCE_MS);
    this.lobbyTimer.unref?.();
  }

  private async broadcastLobby(): Promise<void> {
    try {
      const rooms = await this.roomService.listOpenRooms();
      this.server.to(LOBBY_ROOM).emit('lobbyUpdated', { rooms });
    } catch (err) {
      this.logger.error(
        'broadcastLobby failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  /**
   * The whole list, not a delta. A handful of rooms makes reconciliation cost
   * more than it saves; worth revisiting past roughly fifty.
   */
  @SubscribeMessage('joinLobby')
  async handleJoinLobby(@ConnectedSocket() client: Socket): Promise<void> {
    await client.join(LOBBY_ROOM);
    client.emit('lobbyUpdated', {
      rooms: await this.roomService.listOpenRooms(),
    });
  }

  @SubscribeMessage('leaveLobby')
  async handleLeaveLobby(@ConnectedSocket() client: Socket): Promise<void> {
    await client.leave(LOBBY_ROOM);
  }

  emitRoomUpdate(roomId: string, room: RoomDto): void {
    this.lobbyChanged();
    try {
      this.server.to(roomId).emit('roomUpdated', room);
    } catch (err) {
      this.logger.error(
        `emitRoomUpdate failed for room ${roomId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  emitPlayerRoundComplete(
    roomId: string,
    data: { userId: string; displayName: string; roundIndex: number },
  ): void {
    try {
      this.server.to(roomId).emit('playerRoundComplete', data);
    } catch (err) {
      this.logger.error(
        `emitPlayerRoundComplete failed for room ${roomId}`,
        err,
      );
    }
  }
}
