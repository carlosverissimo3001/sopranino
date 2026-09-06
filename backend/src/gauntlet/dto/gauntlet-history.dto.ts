import { ApiProperty } from '@nestjs/swagger';
import { GauntletDifficulty, GauntletSource } from '@prisma/client';
import { TrackEntity } from '../../track/entities/track.entity';

export class GauntletHistoryEntryDto {
  @ApiProperty({ description: 'The gauntlet run ID' })
  id: string;

  @ApiProperty({ description: 'Date of the run (yyyy-MM-dd)' })
  date: string;

  @ApiProperty({ description: 'Final score (consecutive correct guesses)' })
  score: number;

  @ApiProperty({
    description: 'Difficulty of the run',
    enum: GauntletDifficulty,
  })
  difficulty: GauntletDifficulty;

  @ApiProperty({
    description:
      'What the run drew from. Only a curated run is ranked against other players.',
    enum: GauntletSource,
  })
  source: GauntletSource;

  @ApiProperty({
    description: 'The tracks that were played in the run',
    type: TrackEntity,
    isArray: true,
  })
  tracks: TrackEntity[];

  @ApiProperty({
    description: 'How many seconds the run lasted',
  })
  durationSeconds: number;
}

export class GauntletHistorySummaryDto {
  @ApiProperty({ description: 'Total runs in the selected scope' })
  totalRuns: number;

  @ApiProperty({ description: 'Best score in the selected scope' })
  bestScore: number;

  @ApiProperty({ description: 'Average score in the selected scope' })
  averageScore: number;

  @ApiProperty({
    description: 'Total correct answers across all runs in scope',
  })
  totalCorrectAnswers: number;
}

export class GauntletHistoryMetaDto {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  currentPage: number;
}

export class GauntletHistoryDto {
  @ApiProperty({ type: [GauntletHistoryEntryDto] })
  items: GauntletHistoryEntryDto[];

  @ApiProperty({ type: GauntletHistoryMetaDto })
  meta: GauntletHistoryMetaDto;

  @ApiProperty({ type: GauntletHistorySummaryDto })
  summary: GauntletHistorySummaryDto;
}
