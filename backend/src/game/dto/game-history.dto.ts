import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GameMode, GameStatus } from '@prisma/client';
import { GuessHistoryDto } from './guess/guess-history.dto';
import { Paginated } from '../../utils/pagination/paginated.dto';

export class StreakFreezeUsageDto {
  @ApiProperty({ description: 'Freeze usage ID' })
  id: string;

  @ApiProperty({ description: 'First covered day (YYYY-MM-DD)' })
  coveredFrom: string;

  @ApiProperty({ description: 'Last covered day (YYYY-MM-DD)' })
  coveredTo: string;

  @ApiProperty({ description: 'Number of freezes consumed' })
  freezesUsed: number;

  @ApiProperty({ description: 'Number of gap days bridged' })
  gapDays: number;

  @ApiProperty({ description: 'Streak count at the time of freeze usage' })
  streakAtTime: number;
}

export class GameHistoryEntryDto {
  @ApiProperty({ description: 'Game session ID' })
  id: string;

  @ApiProperty({
    description: 'Date (YYYY-MM-DD) from completedAt or createdAt',
  })
  date: string;

  @ApiProperty({ description: 'Game status', enum: GameStatus })
  status: GameStatus;

  @ApiPropertyOptional({
    description: 'Score 0-6, may be null if abandoned',
    type: Number,
  })
  score?: number;

  @ApiProperty({ description: 'The game mode', enum: GameMode })
  mode: GameMode;

  @ApiProperty({
    description: 'Guess history',
    type: GuessHistoryDto,
    isArray: true,
  })
  guesses: GuessHistoryDto[];

  @ApiProperty({ description: 'Track name (answer)' })
  trackName: string;

  @ApiProperty({ description: 'Artist name' })
  artistName: string;

  @ApiPropertyOptional({ description: 'Album image URL', type: String })
  albumImageUrl?: string;
}

export class GameHistoryDto extends Paginated(GameHistoryEntryDto) {
  @ApiPropertyOptional({
    description:
      'Streak freeze usages within the date range (only for DAILY mode)',
    type: StreakFreezeUsageDto,
    isArray: true,
  })
  streakFreezeUsages?: StreakFreezeUsageDto[];
}
