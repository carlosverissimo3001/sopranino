import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { GameStatus, RoomStatus } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { GuessDto } from '../../game/dto/guess/guess.dto';
import { GuessResultDto } from '../../game/dto/guess/guess-result.dto';
import { GuessHistoryDto } from '../../game/dto/guess/guess-history.dto';
import { MAX_ROUNDS, ROUND_DURATIONS } from '../../game/consts';
import {
  evaluateGuess,
  addGuessToHistory,
  calculateNextState,
  getSnippetDuration,
} from '../../game/utils/guess-evaluator';
import { normalizeText } from '../../utils/text';
import {
  RoomRepository,
  RoomWithPlayers,
} from '../repositories/room.repository';
import { MultiplayerGameSessionRepository } from '../repositories/multiplayer-game-session.repository';
import { MultiplayerRoundStateDto } from '../dto/multiplayer-round-state.dto';
import {
  ScoreboardDto,
  ScoreboardRoundDto,
  ScoreboardPlayerRoundDto,
  ScoreboardPlayerTotalDto,
} from '../dto/scoreboard.dto';
import { RoomsGateway } from '../gateways/rooms.gateway';
import { RoomPresenceService } from './room-presence.service';
import { RoomDto } from '../dto/room.dto';
import { TrackEntity } from '../../track/entities/track.entity';
import { TrackService } from '../../track/services/track.service';
import { catalogueTrackUrl } from '../../utils/utils';
import { mapTrack } from '../../utils/mappers';

function toStandings(room: RoomWithPlayers): ScoreboardPlayerTotalDto[] {
  return room.players
    .map((p) => ({
      userId: p.userId,
      displayName: p.user.displayName,
      avatarUrl: p.user.avatarUrl ?? undefined,
      totalScore: p.totalScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

@Injectable()
export class MultiplayerGameService {
  constructor(
    private readonly authService: AuthService,
    private readonly roomRepository: RoomRepository,
    private readonly gameSessionRepository: MultiplayerGameSessionRepository,
    @Inject(forwardRef(() => RoomsGateway))
    private readonly roomsGateway: RoomsGateway,
    private readonly trackService: TrackService,
    private readonly presence: RoomPresenceService,
  ) {}

  async getRoundState(
    sessionId: string,
    roomId: string,
  ): Promise<MultiplayerRoundStateDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (
      room.status !== RoomStatus.PLAYING &&
      room.status !== RoomStatus.COMPLETED
    ) {
      throw new BadRequestException('Game has not started yet');
    }

    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isPlayer) {
      throw new ForbiddenException('You are not in this room');
    }

    // Find all this player's sessions in this room, ordered by creation
    const playerSessions = await this.gameSessionRepository.findPlayerSessions(
      userId,
      roomId,
    );

    // Determine current round index for this player
    const completedRounds = playerSessions.filter(
      (s) => s.status !== GameStatus.PLAYING,
    ).length;
    const currentRoundIndex = Math.min(
      completedRounds,
      room.trackIds.length - 1,
    );

    // Find or create session for the current round
    const trackId = room.trackIds[currentRoundIndex];
    let currentSession = playerSessions.find((s) => s.trackId === trackId);

    if (!currentSession) {
      currentSession = await this.gameSessionRepository.createSession(
        userId,
        roomId,
        trackId,
      );
    }

    const track = mapTrack(currentSession.track);
    const guesses =
      (currentSession.guesses as unknown as GuessHistoryDto[]) ?? [];
    const isComplete = currentSession.status !== GameStatus.PLAYING;
    // resolvePreview, not playableUrl: a pool track is seeded without audio
    // because Deezer's links expire in minutes, so it has to be minted here.
    const previewUrl = (await this.trackService.resolvePreview(track)) ?? '';

    return {
      sessionId: currentSession.id,
      roundIndex: currentRoundIndex,
      totalRounds: room.roundCount,
      currentGuess: currentSession.currentRound,
      snippetDuration: getSnippetDuration(currentSession.currentRound),
      snippetSteps: [...ROUND_DURATIONS],
      maxGuessesPerSong: MAX_ROUNDS,
      status: currentSession.status,
      guesses,
      previewUrl,
      answer: isComplete
        ? {
            id: track.id,
            name: track.name,
            normalizedName: normalizeText(track.name),
            artist: track.artistName,
            normalizedArtist: normalizeText(track.artistName),
            allArtists: track.allArtists,
            trackUrl: catalogueTrackUrl(track.id),
            albumImageUrl: track.albumImageUrl || undefined,
            albumName: track.albumName || undefined,
            albumUrl: track.albumUrl || undefined,
            releaseYear: track.releaseYear || undefined,
          }
        : undefined,
    };
  }

  async submitGuess(
    sessionId: string,
    roomId: string,
    guess: GuessDto,
  ): Promise<GuessResultDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    const room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== RoomStatus.PLAYING) {
      throw new BadRequestException('Game is not in progress');
    }

    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isPlayer) {
      throw new ForbiddenException('You are not in this room');
    }

    // Find the player's current active session in this room
    const activeSession = await this.gameSessionRepository.findActiveSession(
      userId,
      roomId,
    );

    if (!activeSession) {
      throw new BadRequestException(
        'No active round — all rounds may be complete',
      );
    }

    const actual = activeSession.track;
    // TODO, fix this cast
    const result = evaluateGuess(guess, actual as TrackEntity);

    const existingGuesses =
      (activeSession.guesses as unknown as GuessHistoryDto[]) ?? [];
    const updatedGuesses = addGuessToHistory(
      existingGuesses,
      result,
      actual as TrackEntity,
      guess,
    );
    const nextRound = activeSession.currentRound + 1;
    const { status, gameOver } = calculateNextState(result, nextRound);

    await this.gameSessionRepository.updateSessionProgress(activeSession.id, {
      currentRound: nextRound,
      guesses: updatedGuesses,
      status,
      completedAt: gameOver ? new Date() : null,
    });

    // If round is over, update player's total score
    if (gameOver) {
      const roundScore =
        status === GameStatus.WON ? MAX_ROUNDS - nextRound + 1 : 0;

      if (roundScore > 0) {
        const player = room.players.find((p) => p.userId === userId)!;
        await this.roomRepository.addToPlayerScore(player.id, roundScore);
      }

      // Notify other players in the room about round completion
      const displayName =
        room.players.find((p) => p.userId === userId)?.user.displayName ??
        'Unknown';
      const roundIndex = room.trackIds.indexOf(activeSession.trackId);
      const isFirstSolve =
        status === GameStatus.WON &&
        (await this.presence.claimFirstSolve(roomId, roundIndex, userId));

      this.roomsGateway.emitPlayerRoundComplete(roomId, {
        userId,
        displayName,
        roundIndex,
        isFirstSolve,
      });
      this.roomsGateway.standingsChanged(roomId);

      // Check if all players have finished all rounds → complete room
      await this.checkRoomCompletion(roomId, room.roundCount);
    }

    return {
      result,
      gameOver,
      status,
      currentRound: nextRound,
      snippetDuration: getSnippetDuration(Math.min(nextRound, MAX_ROUNDS - 1)),
      maxRounds: MAX_ROUNDS,
    };
  }

  /**
   * The half of a scoreboard that is the same for everyone. Rounds are scoped
   * to what the reader has played; totals are not, so these can be broadcast.
   */
  async getStandings(roomId: string): Promise<ScoreboardPlayerTotalDto[]> {
    const room = await this.roomRepository.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return toStandings(room);
  }

  async getScoreboard(
    sessionId: string,
    roomId: string,
  ): Promise<ScoreboardDto> {
    const { id: userId } = await this.authService.getUserBySessionId(sessionId);
    let room = await this.roomRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Completion is otherwise only judged at the moment a round ends. Anyone
    // opening the scoreboard is a second chance to notice the room is over.
    if (room.status === RoomStatus.PLAYING) {
      await this.checkRoomCompletion(roomId, room.roundCount);
      room = (await this.roomRepository.findById(roomId)) ?? room;
    }

    const isPlayer = room.players.some((p) => p.userId === userId);
    if (!isPlayer) {
      throw new ForbiddenException('You are not in this room');
    }

    // Get all game sessions for this room
    const allSessions =
      await this.gameSessionRepository.findAllRoomSessions(roomId);

    // Group sessions by trackId to determine round index
    const trackToRoundIndex = new Map<string, number>();
    room.trackIds.forEach((tid, idx) => trackToRoundIndex.set(tid, idx));

    // Find which rounds the requesting player has completed
    const callerCompletedRounds = new Set<number>();
    for (const s of allSessions) {
      if (s.userId === userId && s.status !== GameStatus.PLAYING) {
        const ri = trackToRoundIndex.get(s.trackId);
        if (ri !== undefined) {
          callerCompletedRounds.add(ri);
        }
      }
    }

    // Build per-round scoreboard (only for rounds caller has completed)
    const rounds: ScoreboardRoundDto[] = [];
    for (const [trackId, roundIndex] of trackToRoundIndex) {
      if (!callerCompletedRounds.has(roundIndex)) {
        continue;
      }

      const roundSessions = allSessions.filter(
        (s) => s.trackId === trackId && s.status !== GameStatus.PLAYING,
      );
      const track = roundSessions[0]?.track;

      const players: ScoreboardPlayerRoundDto[] = roundSessions.map((s) => {
        const won = s.status === GameStatus.WON;
        const score = won ? MAX_ROUNDS - s.currentRound + 1 : 0;
        return {
          userId: s.userId,
          displayName: s.user.displayName,
          avatarUrl: s.user.avatarUrl ?? undefined,
          score,
          guessCount: s.currentRound,
          won,
        };
      });

      rounds.push({
        roundIndex,
        players,
        trackName: track?.name,
        artistName: track?.artistName,
        albumImageUrl: track?.albumImageUrl ?? undefined,
      });
    }

    rounds.sort((a, b) => a.roundIndex - b.roundIndex);

    return {
      rounds,
      standings: toStandings(room),
      roomStatus: room.status,
      isComplete: room.status === RoomStatus.COMPLETED,
    };
  }

  /**
   * Called when someone drops out of a room, because a player who closes their
   * tab mid-round never finishes and would otherwise hold the results hostage.
   */
  async reconcileCompletion(roomId: string): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (room) {
      await this.checkRoomCompletion(roomId, room.roundCount);
    }
  }

  private async checkRoomCompletion(
    roomId: string,
    roundCount: number,
  ): Promise<void> {
    const room = await this.roomRepository.findById(roomId);
    if (!room || room.status !== RoomStatus.PLAYING) {
      return;
    }

    // A player who walked away cannot be waited on. Presence lapses only after
    // the heartbeat window, so a refresh does not count as leaving.
    const present = new Set(await this.presence.onlineUserIds(roomId));

    let anyoneFinished = false;

    for (const player of room.players) {
      const completedCount =
        await this.gameSessionRepository.countCompletedSessions(
          player.userId,
          roomId,
        );

      if (completedCount >= roundCount) {
        anyoneFinished = true;
        continue;
      }

      // Only a player who is both unfinished and still here is worth waiting
      // on. Presence is not a condition for ending a room everyone has already
      // played out: their results are here when they come back, and a socket
      // that blinked at the wrong moment used to strand them forever.
      if (present.has(player.userId)) {
        return;
      }
    }

    // Nobody played it out, so there is no result to announce. Expiry is the
    // cleanup job's business; completing it here would invent one.
    if (!anyoneFinished) {
      return;
    }

    // Nobody is left with rounds to play
    const updated = await this.roomRepository.updateStatus(
      roomId,
      RoomStatus.COMPLETED,
      { completedAt: new Date() },
    );
    this.roomsGateway.emitRoomUpdate(roomId, RoomDto.fromEntity(updated));
  }
}
