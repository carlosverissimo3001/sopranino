import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GuessResult } from '../../consts';
import { GameStatus } from '@prisma/client';
import { HintDto } from '../hint/hint.dto';
import { TrackOptionDto } from '../../../track/dto/track-option.dto';

export class GuessResultDto {
  @ApiProperty({ enum: GuessResult, description: 'The result of the guess' })
  result: GuessResult;

  @ApiProperty({ description: 'Whether the game is over' })
  gameOver: boolean;

  @ApiProperty({ description: 'The status of the game', enum: GameStatus })
  status: GameStatus;

  @ApiProperty({ description: 'The current round of the game' })
  currentRound: number;

  @ApiProperty({ description: 'The duration of the current snippet' })
  snippetDuration: number;

  @ApiProperty({ description: 'The maximum number of rounds in the game' })
  maxRounds: number;

  @ApiProperty({
    description: 'Optional personalized rank title (easter egg)',
    required: false,
  })
  rankTitle?: string;

  @ApiProperty({
    description: 'Optional personalized note (easter egg)',
    required: false,
  })
  specialNote?: string;

  @ApiPropertyOptional({
    description: 'Progressive song metadata hints for the next round',
    type: HintDto,
    isArray: true,
  })
  hints?: HintDto[];

  @ApiPropertyOptional({
    description: 'Four choices, when the next round is the last',
    type: TrackOptionDto,
    isArray: true,
  })
  choices?: TrackOptionDto[];
}
