import { TrackArtistsService } from '../../track/services/track-artists.service';
import { getQueueToken } from '@nestjs/bullmq';
import { AppLoggerService } from '../../logger/logger.service';
import {
  CLOSE_ROOM_FINISH_WINDOW_JOB,
  ROOM_CLEANUP_QUEUE,
  ROOM_FINISH_WINDOW_MAX_MS,
  ROOM_FINISH_WINDOW_PER_ROUND_MS,
} from '../../consts';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { GameStatus, RoomStatus, TrackGroupType } from '@prisma/client';
import { MultiplayerGameService } from './multiplayer-game.service';
import { RoomRepository } from '../repositories/room.repository';
import { MultiplayerGameSessionRepository } from '../repositories/multiplayer-game-session.repository';
import { AuthService } from '../../auth/services/auth.service';
import { RoomsGateway } from '../gateways/rooms.gateway';
import { RoomPresenceService } from './room-presence.service';
import { TrackService } from '../../track/services/track.service';

describe('MultiplayerGameService', () => {
  let service: MultiplayerGameService;

  const HOST_SESSION = 'session-host';
  const PLAYER_SESSION = 'session-player';
  const HOST_USER_ID = 'user-host';
  const PLAYER_USER_ID = 'user-player';
  const ROOM_ID = 'room-123';
  const TRACK_1 = 'track-1';
  const TRACK_2 = 'track-2';
  const SESSION_ID = 'game-session-1';

  const mockTrack = {
    id: TRACK_1,
    name: 'Test Song',
    artistName: 'Test Artist',
    albumName: 'Test Album',
    albumImageUrl: 'https://example.com/album.jpg',
    albumUrl: null,
    releaseYear: 2024,
    previewUrl: 'https://example.com/preview.mp3',
    lastScrapedAt: new Date(),
    createdAt: new Date(),
  };

  const makeRoom = (overrides?: Record<string, unknown>) => ({
    id: ROOM_ID,
    inviteCode: 'ABCD1234',
    hostId: HOST_USER_ID,
    roundCount: 2,
    status: RoomStatus.PLAYING,
    trackIds: [TRACK_1, TRACK_2],
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: new Date(),
    completedAt: null,
    players: [
      {
        id: 'rp-host',
        roomId: ROOM_ID,
        userId: HOST_USER_ID,
        totalScore: 0,
        joinedAt: new Date(),
        user: { displayName: 'Host', avatarUrl: null },
      },
      {
        id: 'rp-player',
        roomId: ROOM_ID,
        userId: PLAYER_USER_ID,
        totalScore: 0,
        joinedAt: new Date(),
        user: { displayName: 'Player', avatarUrl: null },
      },
    ],
    ...overrides,
  });

  const makeSession = (overrides?: Record<string, unknown>) => ({
    id: SESSION_ID,
    userId: HOST_USER_ID,
    playlistId: `multiplayer-${ROOM_ID}`,
    mode: 'MULTIPLAYER',
    trackId: TRACK_1,
    currentRound: 0,
    guesses: [],
    status: GameStatus.PLAYING,
    multiplayerRoomId: ROOM_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    track: mockTrack,
    ...overrides,
  });

  const mockAuthService = {
    getUserBySessionId: jest.fn(),
  };

  const mockRoomRepository = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    addToPlayerScore: jest.fn(),
  };

  const mockGameSessionRepository = {
    findPlayerSessions: jest.fn(),
    createSession: jest.fn(),
    findActiveSession: jest.fn(),
    updateSessionProgress: jest.fn(),
    findAllRoomSessions: jest.fn(),
    countCompletedByPlayer: jest.fn(),
  };

  /** What each player has played out, as one query gives it. */
  const completedBy = (host: number, player: number) =>
    new Map([
      [HOST_USER_ID, host],
      [PLAYER_USER_ID, player],
    ]);

  const mockRoomsGateway = {
    standingsChanged: jest.fn(),
    emitRoomUpdate: jest.fn(),
    emitPlayerRoundComplete: jest.fn(),
  };

  // Rooms only finish for players who are still in them, so every existing
  // case has to say who that is.
  const mockQueue = { add: jest.fn() };

  const mockPresence = {
    claimFirstSolve: jest.fn().mockResolvedValue(true),
    onlineUserIds: jest.fn(),
  };

  const mockEnrich = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiplayerGameService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: getQueueToken(ROOM_CLEANUP_QUEUE), useValue: mockQueue },
        {
          provide: AppLoggerService,
          useValue: { child: () => ({ error: jest.fn(), log: jest.fn() }) },
        },
        { provide: RoomRepository, useValue: mockRoomRepository },
        {
          provide: MultiplayerGameSessionRepository,
          useValue: mockGameSessionRepository,
        },
        { provide: RoomsGateway, useValue: mockRoomsGateway },
        { provide: RoomPresenceService, useValue: mockPresence },
        {
          provide: TrackArtistsService,
          useValue: {
            artistsOf: jest.fn((track: { artistName?: string | null }) =>
              Promise.resolve(track.artistName ? [track.artistName] : []),
            ),
          },
        },
        {
          provide: TrackService,
          useValue: {
            enrichInBackground: mockEnrich,
            // A pool track carries no preview, so the round mints one.
            resolvePreview: jest
              .fn()
              .mockImplementation((track: { previewUrl?: string | null }) =>
                Promise.resolve(track?.previewUrl ?? null),
              ),
          },
        },
      ],
    }).compile();

    service = module.get<MultiplayerGameService>(MultiplayerGameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Everyone is still in the room unless a case says otherwise.
    mockPresence.onlineUserIds.mockResolvedValue([
      HOST_USER_ID,
      PLAYER_USER_ID,
    ]);
  });

  describe('getRoundState', () => {
    it('should return round state for a player in a PLAYING room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([]);
      mockGameSessionRepository.createSession.mockResolvedValue(makeSession());

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

      expect(result.sessionId).toBe(SESSION_ID);
      expect(result.roundIndex).toBe(0);
      expect(result.totalRounds).toBe(2);
      expect(result.previewUrl).toBe(mockTrack.previewUrl);
      expect(result.status).toBe(GameStatus.PLAYING);
      expect(result.answer).toBeUndefined();
    });

    it("hints the year, not the decade, in a decade set's room", async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({
          trackGroup: { name: '2020s', type: TrackGroupType.DECADE },
        }),
      );
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        makeSession({
          currentRound: 2,
          track: { ...mockTrack, allArtists: ['Test Artist'] },
        }),
      ]);

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

      expect(result.hints).toContainEqual(
        expect.objectContaining({ label: 'Year', value: '2024' }),
      );
    });

    it('shows a finished round again when asked for it, answer and all', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        makeSession({ status: GameStatus.WON }),
      ]);

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID, 0);

      expect(result.roundIndex).toBe(0);
      expect(result.status).toBe(GameStatus.WON);
      expect(result.answer).toBeDefined();
      expect(mockGameSessionRepository.createSession).not.toHaveBeenCalled();
    });

    it('will not open a round the player has not reached', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        makeSession(),
      ]);

      await expect(
        service.getRoundState(HOST_SESSION, ROOM_ID, 1),
      ).rejects.toThrow(BadRequestException);
      expect(mockGameSessionRepository.createSession).not.toHaveBeenCalled();
    });

    it('starts the next round once the player asks for it', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        makeSession({ status: GameStatus.WON }),
      ]);
      mockGameSessionRepository.createSession.mockResolvedValue(
        makeSession({ id: 'session-2', trackId: TRACK_2 }),
      );

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID, 1);

      expect(result.roundIndex).toBe(1);
      expect(mockGameSessionRepository.createSession).toHaveBeenCalledWith(
        HOST_USER_ID,
        ROOM_ID,
        TRACK_2,
      );
    });

    it('should advance to next round after completing one', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        makeSession({ status: GameStatus.WON }), // completed round 0
      ]);
      mockGameSessionRepository.createSession.mockResolvedValue(
        makeSession({ id: 'session-2', trackId: TRACK_2 }),
      );

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

      expect(result.roundIndex).toBe(1);
      expect(mockGameSessionRepository.createSession).toHaveBeenCalledWith(
        HOST_USER_ID,
        ROOM_ID,
        TRACK_2,
      );
    });

    it('should return existing session if already created for current round', async () => {
      const existing = makeSession();
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        existing,
      ]);

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

      expect(result.sessionId).toBe(SESSION_ID);
      expect(mockGameSessionRepository.createSession).not.toHaveBeenCalled();
    });

    it('should include answer when round is complete', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ roundCount: 1, trackIds: [TRACK_1] }),
      );
      mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
        makeSession({ status: GameStatus.WON }),
      ]);

      const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

      expect(result.answer).toBeDefined();
      expect(result.answer!.name).toBe('Test Song');
    });

    describe('hints', () => {
      beforeEach(() => {
        mockAuthService.getUserBySessionId.mockResolvedValue({
          id: HOST_USER_ID,
        });
        mockRoomRepository.findById.mockResolvedValue(makeRoom());
      });

      // A refreshed page reads this, so it has to carry what was earned.
      it('returns the hints earned so far in a round still in play', async () => {
        mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
          makeSession({ currentRound: 1 }),
        ]);

        const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

        expect(result.hints).toEqual([
          expect.objectContaining({ type: 'DECADE', value: '2020s' }),
        ]);
      });

      it('returns none once the round is over', async () => {
        mockRoomRepository.findById.mockResolvedValue(
          makeRoom({ roundCount: 1, trackIds: [TRACK_1] }),
        );
        mockGameSessionRepository.findPlayerSessions.mockResolvedValue([
          makeSession({ status: GameStatus.WON, currentRound: 3 }),
        ]);

        const result = await service.getRoundState(HOST_SESSION, ROOM_ID);

        expect(result.hints).toBeUndefined();
      });

      it('looks up fame when a round starts, not on every read', async () => {
        mockGameSessionRepository.findPlayerSessions.mockResolvedValueOnce([]);
        mockGameSessionRepository.createSession.mockResolvedValue(
          makeSession(),
        );
        await service.getRoundState(HOST_SESSION, ROOM_ID);

        mockGameSessionRepository.findPlayerSessions.mockResolvedValueOnce([
          makeSession(),
        ]);
        await service.getRoundState(HOST_SESSION, ROOM_ID);

        expect(mockEnrich).toHaveBeenCalledTimes(1);
        expect(mockEnrich).toHaveBeenCalledWith(
          expect.objectContaining({ id: TRACK_1 }),
        );
      });
    });

    it('should throw NotFoundException for non-existent room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(null);

      await expect(
        service.getRoundState(HOST_SESSION, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when room is WAITING', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.WAITING }),
      );

      await expect(
        service.getRoundState(HOST_SESSION, ROOM_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user is not in the room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'stranger',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.getRoundState('session-stranger', ROOM_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitGuess', () => {
    const guessDto = {
      trackId: TRACK_1,
      trackName: 'Test Song',
      artistName: 'Test Artist',
      albumName: 'Test Album',
      skip: false,
    };

    it('should accept a correct guess and update score', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockGameSessionRepository.updateSessionProgress.mockResolvedValue(
        undefined,
      );
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(0, 0),
      );

      const result = await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(result.result).toBe('CORRECT');
      expect(result.gameOver).toBe(true);
      expect(result.status).toBe(GameStatus.WON);
      expect(mockRoomRepository.addToPlayerScore).toHaveBeenCalledWith(
        'rp-host',
        6, // First guess correct = 6 points
      );
    });

    it('should accept a skip without updating score', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );

      const result = await service.submitGuess(HOST_SESSION, ROOM_ID, {
        skip: true,
      });

      expect(result.result).toBe('SKIP');
      expect(result.gameOver).toBe(false);
      expect(mockRoomRepository.addToPlayerScore).not.toHaveBeenCalled();
    });

    it('unlocks the next hint with a spent guess', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );

      const result = await service.submitGuess(HOST_SESSION, ROOM_ID, {
        skip: true,
      });

      expect(result.hints).toEqual([
        expect.objectContaining({ type: 'DECADE', value: '2020s' }),
      ]);
    });

    it('sends no hints once the round is decided', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(0, 0),
      );

      const result = await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(result.hints).toBeUndefined();
    });

    it('should throw when room is not PLAYING', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.COMPLETED }),
      );

      await expect(
        service.submitGuess(HOST_SESSION, ROOM_ID, guessDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when no active session exists', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(null);

      await expect(
        service.submitGuess(HOST_SESSION, ROOM_ID, guessDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for non-player', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'stranger',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.submitGuess('session-stranger', ROOM_ID, guessDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should complete room when all players finish all rounds', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      // The completed room is broadcast via RoomDto.fromEntity, so this must
      // resolve to a room rather than undefined.
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      // After this guess, all players have completed all rounds
      // Both played it out.
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 2),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        { completedAt: expect.any(Date), finishDeadline: null },
      );
    });

    it('puts the rest on the clock once the first player is done', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      // The host has played it out; the other is still here, mid-round.
      mockPresence.onlineUserIds.mockResolvedValue([
        HOST_USER_ID,
        PLAYER_USER_ID,
      ]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 1),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.PLAYING,
        { finishDeadline: expect.any(Date) },
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        CLOSE_ROOM_FINISH_WINDOW_JOB,
        { roomId: ROOM_ID },
        // The room in these tests runs two rounds.
        expect.objectContaining({ delay: 2 * ROOM_FINISH_WINDOW_PER_ROUND_MS }),
      );
    });

    it('ignores a player who skipped their way to the end', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockPresence.onlineUserIds.mockResolvedValue([
        HOST_USER_ID,
        PLAYER_USER_ID,
      ]);
      // The other player raced to the end; the host is still on a song.
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(1, 2),
      );

      await service.submitGuess(PLAYER_SESSION, ROOM_ID, guessDto);

      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('never makes anyone wait longer than the ceiling', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      // Twenty rounds would be 200s of window without the ceiling.
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ roundCount: 20 }),
      );
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockPresence.onlineUserIds.mockResolvedValue([
        HOST_USER_ID,
        PLAYER_USER_ID,
      ]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(20, 1),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockQueue.add).toHaveBeenCalledWith(
        CLOSE_ROOM_FINISH_WINDOW_JOB,
        { roomId: ROOM_ID },
        expect.objectContaining({ delay: ROOM_FINISH_WINDOW_MAX_MS }),
      );
    });

    it('leaves a window already running where it is', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      const deadline = new Date(Date.now() + 20_000);
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ finishDeadline: deadline }),
      );
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockPresence.onlineUserIds.mockResolvedValue([
        HOST_USER_ID,
        PLAYER_USER_ID,
      ]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 1),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockQueue.add).not.toHaveBeenCalled();
      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('stops waiting on anyone once the window has run out', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ finishDeadline: new Date(Date.now() - 1) }),
      );
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      // Still here, still unfinished, and no longer waited on.
      mockPresence.onlineUserIds.mockResolvedValue([
        HOST_USER_ID,
        PLAYER_USER_ID,
      ]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 1),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        { completedAt: expect.any(Date), finishDeadline: null },
      );
    });

    it('completes the room when the only unfinished player has left', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      // The other player closed their tab, so their heartbeat has lapsed.
      mockPresence.onlineUserIds.mockResolvedValue([HOST_USER_ID]);
      // Only the host is ever counted; the absent player has finished nothing.
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 2),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        { completedAt: expect.any(Date), finishDeadline: null },
      );
    });

    it('keeps waiting on a player who is still in the room', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 1),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        expect.anything(),
      );
    });

    // Two players finished every round and sat on the waiting screen forever
    // because both sockets happened to be reconnecting when the last guess
    // landed. Presence says who is worth waiting on, not whether a finished
    // room is allowed to end.
    it('ends a room everyone played out, even with every socket dropped', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockPresence.onlineUserIds.mockResolvedValue([]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 2),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        { completedAt: expect.any(Date), finishDeadline: null },
      );
    });

    it('does not announce a result for a room nobody played out', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findActiveSession.mockResolvedValue(
        makeSession(),
      );
      mockPresence.onlineUserIds.mockResolvedValue([]);
      // Everyone walked away mid-game: there is no result to announce.
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(1, 1),
      );

      await service.submitGuess(HOST_SESSION, ROOM_ID, guessDto);

      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        expect.anything(),
      );
    });
  });

  describe('endGame', () => {
    it('ends the wait once the host has played the room out', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 1),
      );
      mockRoomRepository.updateStatus.mockResolvedValue(
        makeRoom({ status: RoomStatus.COMPLETED, endedByHost: true }),
      );

      const result = await service.endGame(HOST_SESSION, ROOM_ID);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        {
          completedAt: expect.any(Date),
          finishDeadline: null,
          endedByHost: true,
        },
      );
      expect(result.endedByHost).toBe(true);
      expect(mockRoomsGateway.emitRoomUpdate).toHaveBeenCalled();
    });

    // Otherwise it cuts everyone else's game off, not a wait.
    it('refuses a host who still has rounds to play', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(1, 2),
      );

      await expect(service.endGame(HOST_SESSION, ROOM_ID)).rejects.toThrow(
        'Finish your own rounds first',
      );
      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('refuses anyone but the host', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(service.endGame(PLAYER_SESSION, ROOM_ID)).rejects.toThrow(
        'Only the host can end the game',
      );
    });

    it('refuses a room that is not under way', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.COMPLETED }),
      );

      await expect(service.endGame(HOST_SESSION, ROOM_ID)).rejects.toThrow(
        'The game is not under way',
      );
    });
  });

  describe('getScoreboard', () => {
    // The waiting screen stops polling while the socket is connected, so a room
    // stuck in PLAYING has no other way back. Opening the scoreboard is it.
    it('ends a room that everyone already finished', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockRoomRepository.updateStatus.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findAllRoomSessions.mockResolvedValue([]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(2, 2),
      );
      mockPresence.onlineUserIds.mockResolvedValue([]);

      await service.getScoreboard(HOST_SESSION, ROOM_ID);

      expect(mockRoomRepository.updateStatus).toHaveBeenCalledWith(
        ROOM_ID,
        RoomStatus.COMPLETED,
        { completedAt: expect.any(Date), finishDeadline: null },
      );
    });

    it('leaves a room in progress alone', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findAllRoomSessions.mockResolvedValue([]);
      mockGameSessionRepository.countCompletedByPlayer.mockResolvedValue(
        completedBy(1, 1),
      );
      mockPresence.onlineUserIds.mockResolvedValue([
        HOST_USER_ID,
        PLAYER_USER_ID,
      ]);

      await service.getScoreboard(HOST_SESSION, ROOM_ID);

      expect(mockRoomRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should only show rounds the caller has completed', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());
      mockGameSessionRepository.findAllRoomSessions.mockResolvedValue([
        // Host completed round 0
        makeSession({
          userId: HOST_USER_ID,
          trackId: TRACK_1,
          status: GameStatus.WON,
          currentRound: 1,
          user: { displayName: 'Host', avatarUrl: null },
        }),
        // Player completed round 0
        makeSession({
          userId: PLAYER_USER_ID,
          trackId: TRACK_1,
          status: GameStatus.LOST,
          currentRound: 6,
          user: { displayName: 'Player', avatarUrl: null },
        }),
        // Player completed round 1 (host hasn't yet)
        makeSession({
          userId: PLAYER_USER_ID,
          trackId: TRACK_2,
          status: GameStatus.WON,
          currentRound: 2,
          user: { displayName: 'Player', avatarUrl: null },
        }),
      ]);

      const result = await service.getScoreboard(HOST_SESSION, ROOM_ID);

      // Host only completed round 0, so only round 0 should be visible
      expect(result.rounds).toHaveLength(1);
      expect(result.rounds[0].roundIndex).toBe(0);
      expect(result.rounds[0].players).toHaveLength(2);
    });

    // A room ended on somebody still has their results page to read.
    it('shows every played round once the room is over', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: PLAYER_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.COMPLETED }),
      );
      mockGameSessionRepository.findAllRoomSessions.mockResolvedValue([
        makeSession({
          userId: HOST_USER_ID,
          trackId: TRACK_1,
          status: GameStatus.WON,
          currentRound: 1,
          user: { displayName: 'Host', avatarUrl: null },
        }),
        makeSession({
          userId: HOST_USER_ID,
          trackId: TRACK_2,
          status: GameStatus.WON,
          currentRound: 2,
          user: { displayName: 'Host', avatarUrl: null },
        }),
      ]);

      const result = await service.getScoreboard(PLAYER_SESSION, ROOM_ID);

      expect(result.rounds.map((r) => r.roundIndex)).toEqual([0, 1]);
    });

    it('should sort standings by total score descending', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({
          players: [
            {
              id: 'rp-host',
              roomId: ROOM_ID,
              userId: HOST_USER_ID,
              totalScore: 3,
              joinedAt: new Date(),
              user: { displayName: 'Host', avatarUrl: null },
            },
            {
              id: 'rp-player',
              roomId: ROOM_ID,
              userId: PLAYER_USER_ID,
              totalScore: 10,
              joinedAt: new Date(),
              user: { displayName: 'Player', avatarUrl: null },
            },
          ],
        }),
      );
      mockGameSessionRepository.findAllRoomSessions.mockResolvedValue([]);

      const result = await service.getScoreboard(HOST_SESSION, ROOM_ID);

      expect(result.standings[0].displayName).toBe('Player');
      expect(result.standings[1].displayName).toBe('Host');
    });

    it('should throw ForbiddenException for non-player', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: 'stranger',
      });
      mockRoomRepository.findById.mockResolvedValue(makeRoom());

      await expect(
        service.getScoreboard('session-stranger', ROOM_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reflect room completion status', async () => {
      mockAuthService.getUserBySessionId.mockResolvedValue({
        id: HOST_USER_ID,
      });
      mockRoomRepository.findById.mockResolvedValue(
        makeRoom({ status: RoomStatus.COMPLETED }),
      );
      mockGameSessionRepository.findAllRoomSessions.mockResolvedValue([]);

      const result = await service.getScoreboard(HOST_SESSION, ROOM_ID);

      expect(result.isComplete).toBe(true);
      expect(result.roomStatus).toBe(RoomStatus.COMPLETED);
    });
  });
});
