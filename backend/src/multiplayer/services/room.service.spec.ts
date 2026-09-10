import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RoomStatus, TrackSource } from '@prisma/client';
import { RoomService } from './room.service';
import { RoomRepository } from '../repositories/room.repository';
import { AuthService } from '../../auth/services/auth.service';
import { TrackPoolService } from './track-pool.service';
import { RoomsGateway } from '../gateways/rooms.gateway';
import { RoomPresenceService } from './room-presence.service';
import { ROOM_MAX_PLAYERS } from '../../consts';

describe('RoomService', () => {
  let service: RoomService;

  const HOST_SESSION = 'session-host';
  const PLAYER_SESSION = 'session-player';
  const HOST_USER_ID = 'user-host';
  const PLAYER_USER_ID = 'user-player';
  const ROOM_ID = 'room-123';
  const INVITE_CODE = 'ABCD1234';

  const mockRoomsGateway = {
    lobbyChanged: jest.fn(),
    emitRoomUpdate: jest.fn(),
    emitPlayerRoundComplete: jest.fn(),
    emitPlayerRemoved: jest.fn(),
  };

  const makeRoom = (overrides?: Record<string, unknown>) => ({
    id: ROOM_ID,
    inviteCode: INVITE_CODE,
    hostId: HOST_USER_ID,
    roundCount: 5,
    name: 'Velvet Chorus',
    findable: true,
    status: RoomStatus.WAITING,
    trackSource: TrackSource.POOL,
    trackIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
    players: [
      {
        id: 'player-1',
        roomId: ROOM_ID,
        userId: HOST_USER_ID,
        totalScore: 0,
        isReady: true,
        joinedAt: new Date(),
        user: { displayName: 'Host', avatarUrl: null },
      },
    ],
    ...overrides,
  });

  const mockAuthService = {
    getUserBySessionId: jest.fn(),
  };

  const mockRoomRepository = {
    createRoom: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPlayerInRoom: jest.fn(),
    claimSeat: jest.fn(),
    removePlayer: jest.fn(),
    updateStatus: jest.fn(),
    setTrackSource: jest.fn(),
    toggleReady: jest.fn(),
    inviteCodeExists: jest.fn(),
    findFindableWaiting: jest.fn(),
  };

  const mockTrackPoolService = {
    selectTracksForRoom: jest.fn(),
  };

  const mockPresence = { onlineUserIds: jest.fn().mockResolvedValue([]) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: RoomRepository, useValue: mockRoomRepository },
        { provide: TrackPoolService, useValue: mockTrackPoolService },
        { provide: RoomsGateway, useValue: mockRoomsGateway },
        { provide: RoomPresenceService, useValue: mockPresence },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room and return RoomDto', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.inviteCodeExists.mockResolvedValue(false);
      mockRoomRepository.createRoom.mockResolvedValue(makeRoom());

      const result = await service.createRoom(HOST_SESSION, { roundCount: 5 });

      expect(result.id).toBe(ROOM_ID);
      expect(result.hostId).toBe(HOST_USER_ID);
      expect(result.roundCount).toBe(5);
      expect(mockRoomRepository.createRoom).toHaveBeenCalledWith(
        expect.objectContaining({
          hostId: HOST_USER_ID,
          roundCount: 5,
          findable: true,
          name: expect.any(String),
        }),
      );
    });

    // The host opts out of being listed; they never opt in.
    it('makes a room findable unless the host says otherwise', async () => {
      mockRoomRepository.createRoom.mockResolvedValue(makeRoom());

      await service.createRoom(HOST_SESSION, { roundCount: 5 });
      expect(mockRoomRepository.createRoom).toHaveBeenLastCalledWith(
        expect.objectContaining({ findable: true }),
      );

      await service.createRoom(HOST_SESSION, {
        roundCount: 5,
        findable: false,
      });
      expect(mockRoomRepository.createRoom).toHaveBeenLastCalledWith(
        expect.objectContaining({ findable: false }),
      );
    });
  });

  describe('listOpenRooms', () => {
    it('lists a room somebody is actually sitting in', async () => {
      mockRoomRepository.findFindableWaiting.mockResolvedValue([makeRoom()]);
      mockPresence.onlineUserIds.mockResolvedValue([HOST_USER_ID]);

      const [room] = await service.listOpenRooms();

      expect(room).toEqual({
        id: ROOM_ID,
        name: 'Velvet Chorus',
        playerCount: 1,
        capacity: ROOM_MAX_PLAYERS,
        roundCount: 5,
        trackSource: TrackSource.POOL,
      });
    });

    // A room is WAITING from the moment it is made, so status alone would
    // list every abandoned create screen for ever.
    it('drops a room everyone has left', async () => {
      mockRoomRepository.findFindableWaiting.mockResolvedValue([makeRoom()]);
      mockPresence.onlineUserIds.mockResolvedValue([]);

      await expect(service.listOpenRooms()).resolves.toEqual([]);
    });

    // Presence is the count, not the roster: a row for somebody who has gone
    // would inflate a room that is emptier than it looks.
    it('counts who is present, not who has a row', async () => {
      mockRoomRepository.findFindableWaiting.mockResolvedValue([
        makeRoom({
          players: [
            { userId: HOST_USER_ID },
            { userId: 'left-the-tab-open' },
            { userId: 'also-gone' },
          ],
        }),
      ]);
      mockPresence.onlineUserIds.mockResolvedValue([HOST_USER_ID]);

      const [room] = await service.listOpenRooms();

      expect(room.playerCount).toBe(1);
    });

    // A room you cannot get into is not an open room.
    it('drops a room whose seats are all taken', async () => {
      mockRoomRepository.findFindableWaiting.mockResolvedValue([
        makeRoom({
          players: Array.from({ length: ROOM_MAX_PLAYERS }, (_, i) => ({
            userId: `user-${i}`,
          })),
        }),
      ]);
      mockPresence.onlineUserIds.mockResolvedValue([HOST_USER_ID]);

      await expect(service.listOpenRooms()).resolves.toEqual([]);
    });

    // Browsing is public; the code is what joining gives you.
    it('never exposes the invite code', async () => {
      mockRoomRepository.findFindableWaiting.mockResolvedValue([makeRoom()]);
      mockPresence.onlineUserIds.mockResolvedValue([HOST_USER_ID]);

      const [room] = await service.listOpenRooms();

      expect(JSON.stringify(room)).not.toContain(INVITE_CODE);
      expect(room).not.toHaveProperty('hostId');
    });
  });

  describe('joinRoom', () => {
    it('should join a WAITING room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue(null);
      mockRoomRepository.claimSeat.mockResolvedValue({ id: 'player-2' });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({
          players: [
            {
              id: 'player-1',
              roomId: ROOM_ID,
              userId: HOST_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Host', avatarUrl: null },
            },
            {
              id: 'player-2',
              roomId: ROOM_ID,
              userId: PLAYER_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Player', avatarUrl: null },
            },
          ],
        }),
      );

      const result = await service.joinRoom(PLAYER_SESSION, INVITE_CODE);

      expect(result.players).toHaveLength(2);
      expect(mockRoomRepository.claimSeat).toHaveBeenCalledWith(
        ROOM_ID,
        PLAYER_USER_ID,
        ROOM_MAX_PLAYERS,
      );
    });

    it('should be idempotent when already in room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue({
        id: 'player-1',
      });

      const result = await service.joinRoom(HOST_SESSION, INVITE_CODE);

      expect(result.id).toBe(ROOM_ID);
      expect(mockRoomRepository.claimSeat).not.toHaveBeenCalled();
    });

    // The repository decides, because only it can count behind the lock.
    it('refuses a full room, and says so', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue(null);
      mockRoomRepository.claimSeat.mockResolvedValue(null);

      await expect(
        service.joinRoom(PLAYER_SESSION, INVITE_CODE),
      ).rejects.toThrow(`This room is full (${ROOM_MAX_PLAYERS} players)`);
    });

    it('should throw NotFoundException for invalid invite code', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(null);

      await expect(service.joinRoom(PLAYER_SESSION, 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when room is PLAYING', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      await expect(
        service.joinRoom(PLAYER_SESSION, INVITE_CODE),
      ).rejects.toThrow(BadRequestException);
    });

    it('should uppercase the invite code', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findByInviteCode.mockResolvedValue(null);

      await expect(
        service.joinRoom(PLAYER_SESSION, 'abcd1234'),
      ).rejects.toThrow(NotFoundException);

      expect(mockRoomRepository.findByInviteCode).toHaveBeenCalledWith(
        'ABCD1234',
      );
    });
  });

  describe('joinFindableRoom', () => {
    it('seats somebody who came from the lobby', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue(null);
      mockRoomRepository.claimSeat.mockResolvedValue({ id: 'player-2' });

      await expect(
        service.joinFindableRoom(PLAYER_SESSION, ROOM_ID),
      ).resolves.toMatchObject({ id: ROOM_ID });
    });

    // Being findable stands in for holding the code, so a room that is not
    // findable answers as though the id were wrong rather than confirming it.
    it('will not let the lobby route into an unlisted room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ findable: false }),
      );

      await expect(
        service.joinFindableRoom(PLAYER_SESSION, ROOM_ID),
      ).rejects.toThrow(NotFoundException);
      expect(mockRoomRepository.claimSeat).not.toHaveBeenCalled();
    });

    // Both ways in share one helper; this is the check that they still do.
    it('refuses a full room the same way joining by code does', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.findPlayerInRoom.mockResolvedValue(null);
      mockRoomRepository.claimSeat.mockResolvedValue(null);

      await expect(
        service.joinFindableRoom(PLAYER_SESSION, ROOM_ID),
      ).rejects.toThrow(`This room is full (${ROOM_MAX_PLAYERS} players)`);
    });
  });

  describe('getRoomState', () => {
    it('shows the room to a player who is in it', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      const result = await service.getRoomState(HOST_SESSION, ROOM_ID);

      expect(result.id).toBe(ROOM_ID);
    });

    it('hides it from anyone else, invite code included', async () => {
      // The room id is in the url of everyone who has ever played; the invite
      // code is what actually decides who gets in.
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'a-stranger',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(service.getRoomState(HOST_SESSION, ROOM_ID)).rejects.toThrow(
        'You are not in this room',
      );
    });
  });

  describe('kickPlayer', () => {
    const OTHER_USER_ID = 'user-2';

    /** makeRoom holds only the host, and there is nobody to remove from that. */
    const roomWithTwo = (overrides?: Record<string, unknown>) => {
      const base = makeRoom(overrides);
      return {
        ...base,
        players: [
          ...base.players,
          {
            id: 'player-2',
            roomId: ROOM_ID,
            userId: OTHER_USER_ID,
            totalScore: 0,
            isReady: false,
            joinedAt: new Date(),
            user: { displayName: 'Guest', avatarUrl: null },
          },
        ],
      };
    };

    it('lets the host clear out a player', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(roomWithTwo());

      await service.kickPlayer(HOST_SESSION, ROOM_ID, OTHER_USER_ID);

      expect(mockRoomRepository.removePlayer).toHaveBeenCalledWith(
        ROOM_ID,
        OTHER_USER_ID,
      );
    });

    it('tells the room so the kicked tab stops pretending', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(roomWithTwo());

      await service.kickPlayer(HOST_SESSION, ROOM_ID, OTHER_USER_ID);

      expect(mockRoomsGateway.emitPlayerRemoved).toHaveBeenCalledWith(
        ROOM_ID,
        OTHER_USER_ID,
      );
    });

    it('refuses anyone who is not the host', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: OTHER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.kickPlayer(HOST_SESSION, ROOM_ID, HOST_USER_ID),
      ).rejects.toThrow('Only the host can remove players');
    });

    it('refuses to remove the host, who would take the room with them', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.kickPlayer(HOST_SESSION, ROOM_ID, HOST_USER_ID),
      ).rejects.toThrow('The host cannot be removed');
    });

    it('refuses once the game is under way, when scores already exist', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        roomWithTwo({ status: RoomStatus.PLAYING }),
      );

      await expect(
        service.kickPlayer(HOST_SESSION, ROOM_ID, OTHER_USER_ID),
      ).rejects.toThrow('The game has already started');
    });
  });

  describe('releaseSeat', () => {
    const OTHER_USER_ID = 'user-2';

    it('gives up the seat of someone who never came back', async () => {
      mockRoomRepository.findById.mockResolvedValue({
        ...makeRoom(),
        players: [
          ...makeRoom().players,
          {
            id: 'player-2',
            roomId: ROOM_ID,
            userId: OTHER_USER_ID,
            totalScore: 0,
            isReady: false,
            joinedAt: new Date(),
            user: { displayName: 'Guest', avatarUrl: null },
          },
        ],
      });

      await service.releaseSeat(ROOM_ID, OTHER_USER_ID);

      expect(mockRoomRepository.removePlayer).toHaveBeenCalledWith(
        ROOM_ID,
        OTHER_USER_ID,
      );
    });

    it('leaves a running game alone, where their rounds are part of it', async () => {
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      await service.releaseSeat(ROOM_ID, OTHER_USER_ID);

      expect(mockRoomRepository.removePlayer).not.toHaveBeenCalled();
    });

    it('never sweeps out the host, which would end everyone else lobby', async () => {
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await service.releaseSeat(ROOM_ID, HOST_USER_ID);

      expect(mockRoomRepository.removePlayer).not.toHaveBeenCalled();
    });
  });

  describe('setTrackSource', () => {
    it('lets the host choose the libraries', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.setTrackSource.mockResolvedValue(
        makeRoom({ trackSource: TrackSource.LIBRARIES }),
      );

      const result = await service.setTrackSource(
        HOST_SESSION,
        ROOM_ID,
        TrackSource.LIBRARIES,
      );

      expect(result.trackSource).toBe(TrackSource.LIBRARIES);
    });

    it('tells the room, so the choice is not a secret the host keeps', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.setTrackSource.mockResolvedValue(
        makeRoom({ trackSource: TrackSource.LIBRARIES }),
      );

      await service.setTrackSource(
        HOST_SESSION,
        ROOM_ID,
        TrackSource.LIBRARIES,
      );

      expect(mockRoomsGateway.emitRoomUpdate).toHaveBeenCalledWith(
        ROOM_ID,
        expect.objectContaining({ trackSource: TrackSource.LIBRARIES }),
      );
    });

    it('refuses anyone who is not the host', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'someone-else',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.setTrackSource(HOST_SESSION, ROOM_ID, TrackSource.LIBRARIES),
      ).rejects.toThrow('Only the host can change the song source');
    });

    it('refuses once the game is under way', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      await expect(
        service.setTrackSource(HOST_SESSION, ROOM_ID, TrackSource.LIBRARIES),
      ).rejects.toThrow('The game has already started');
    });
  });

  describe('startGame', () => {
    it('should let host start a WAITING room with track pooling', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockTrackPoolService.selectTracksForRoom.mockResolvedValue([
        'track-1',
        'track-2',
        'track-3',
        'track-4',
        'track-5',
      ]);
      mockRoomRepository.updateStatus.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      const result = await service.startGame(HOST_SESSION, ROOM_ID);

      expect(result.status).toBe(RoomStatus.PLAYING);
      expect(mockTrackPoolService.selectTracksForRoom).toHaveBeenCalledWith(
        [HOST_USER_ID],
        5,
        TrackSource.POOL,
      );
      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.PLAYING,
        {
          startedAt: expect.any(Date),
          trackIds: ['track-1', 'track-2', 'track-3', 'track-4', 'track-5'],
        },
      );
    });

    it('should throw ForbiddenException when non-host tries to start', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(service.startGame(PLAYER_SESSION, ROOM_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when room is already PLAYING', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.PLAYING }),
      );

      await expect(service.startGame(HOST_SESSION, ROOM_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException for non-existent room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(
        service.startGame(HOST_SESSION, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('leaveRoom', () => {
    it('should expire room when host leaves', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await service.leaveRoom(HOST_SESSION, ROOM_ID);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.EXPIRED,
      );
      expect(mockRoomRepository.removePlayer).not.toHaveBeenCalled();
    });

    it('should remove player when non-host leaves', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({
          players: [
            {
              id: 'player-1',
              roomId: ROOM_ID,
              userId: HOST_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Host', avatarUrl: null },
            },
            {
              id: 'player-2',
              roomId: ROOM_ID,
              userId: PLAYER_USER_ID,
              totalScore: 0,
              joinedAt: new Date(),
              user: { displayName: 'Player', avatarUrl: null },
            },
          ],
        }),
      );

      await service.leaveRoom(PLAYER_SESSION, ROOM_ID);

      expect(mockRoomRepository.removePlayer).toHaveBeenCalledWith(
        ROOM_ID,
        PLAYER_USER_ID,
      );
      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when user is not in room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'stranger',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.leaveRoom('session-stranger', ROOM_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
