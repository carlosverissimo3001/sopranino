import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameStatus } from '@prisma/client';
import { GuessHistoryDto } from '../../game/dto/guess/guess-history.dto';
import { TrackOptionDto } from '../../track/dto/track-option.dto';
import { HintDto } from '../../game/dto/hint/hint.dto';

export class MultiplayerRoundStateDto {
  @ApiProperty({ description: 'The game session ID for this round' })
  sessionId: string;

  @ApiProperty({ description: 'Room round index (0-based)' })
  roundIndex: number;

  @ApiProperty({ description: 'Total rounds in the room' })
  totalRounds: number;

  @ApiProperty({ description: 'Guess count within this round' })
  currentGuess: number;

  @ApiProperty({ description: 'Snippet duration for the current guess' })
  snippetDuration: number;

  @ApiProperty({
    description:
      'Snippet length for every guess, so the progress bar can scale to them',
    type: [Number],
  })
  snippetSteps: number[];

  @ApiProperty({ description: 'Maximum number of guesses per song' })
  maxGuessesPerSong: number;

  @ApiProperty({ enum: GameStatus })
  status: GameStatus;

  @ApiProperty({ type: [GuessHistoryDto] })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: 'Track preview URL' })
  previewUrl: string;

  @ApiPropertyOptional({
    description: 'Answer (only when round is complete)',
    type: TrackOptionDto,
  })
  answer?: TrackOptionDto;

  @ApiPropertyOptional({
    description: 'Hints earned so far (only while the round is in play)',
    type: HintDto,
    isArray: true,
  })
  hints?: HintDto[];
}
