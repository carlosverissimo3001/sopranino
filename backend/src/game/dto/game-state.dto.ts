import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameStatus } from '@prisma/client';
import { TrackOptionDto } from '@/track/dto/track-option.dto';
import { GuessHistoryDto } from './guess/guess-history.dto';
import { HintDto } from './hint/hint.dto';

export class GameStateDto {
  @ApiProperty({ description: 'The ID of the game session' })
  sessionId: string;

  @ApiProperty({ description: 'The current round of the game' })
  currentRound: number;

  @ApiProperty({ description: 'The duration of the current snippet' })
  snippetDuration: number;

  @ApiProperty({ description: 'The maximum number of rounds in the game' })
  maxRounds: number;

  @ApiProperty({
    description:
      'Snippet length for every round, so the client can show what each miss unlocks',
    type: Number,
    isArray: true,
  })
  snippetSteps: number[];

  @ApiProperty({ description: 'The status of the game', enum: GameStatus })
  status: GameStatus;

  @ApiProperty({
    description: 'The guesses of the game',
    type: GuessHistoryDto,
    isArray: true,
  })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: 'The preview URL of the current track' })
  previewUrl: string;

  @ApiPropertyOptional({
    description: 'The answer to the current track',
    type: TrackOptionDto,
  })
  answer?: TrackOptionDto;

  @ApiPropertyOptional({
    description: 'Album art URL, exposed progressively during gameplay',
  })
  albumImageUrl?: string;

  @ApiPropertyOptional({
    description:
      'Optional personalized rank title (easter egg for special users)',
  })
  rankTitle?: string;

  @ApiPropertyOptional({
    description: 'Optional personalized note (easter egg for special users)',
  })
  specialNote?: string;

  @ApiPropertyOptional({
    description: 'Progressive song metadata hints for the current round',
    type: HintDto,
    isArray: true,
  })
  hints?: HintDto[];

  @ApiPropertyOptional({
    description: 'Four choices, while the last round is in play',
    type: TrackOptionDto,
    isArray: true,
  })
  choices?: TrackOptionDto[];
}
