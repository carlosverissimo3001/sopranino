import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GauntletRunStatus } from '@prisma/client';

export class ActualTrackDto {
  @ApiProperty({ description: 'Track name' })
  name: string;

  @ApiProperty({ description: 'Artist name' })
  artistName: string;

  @ApiPropertyOptional({ description: 'Album art URL', type: String })
  albumArt?: string;
}

export class GauntletGuessResultDto {
  @ApiProperty({
    description: 'Whether the guess was correct',
  })
  correct: boolean;

  @ApiProperty({
    description: 'Whether the run is over (wrong guess or skip)',
  })
  runOver: boolean;

  @ApiProperty({
    description: 'Current score (consecutive correct guesses)',
  })
  score: number;

  @ApiProperty({
    description: 'Status of the run after this guess',
    enum: GauntletRunStatus,
  })
  status: GauntletRunStatus;

  @ApiPropertyOptional({
    description: 'The actual track that was being guessed (always revealed)',
    type: ActualTrackDto,
  })
  actualTrack?: ActualTrackDto;

  @ApiPropertyOptional({
    description: 'Preview URL for the next track (if run continues)',
    type: String,
  })
  nextPreviewUrl?: string;

  @ApiPropertyOptional({
    description: 'Snippet duration in seconds for the next track',
    type: Number,
  })
  nextSnippetDuration?: number;

  @ApiPropertyOptional({
    description:
      'Whether this score is a new all-time personal best (set when run ends)',
    type: Boolean,
  })
  isNewPersonalBest?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this score is a new daily best (set when run ends)',
    type: Boolean,
  })
  isNewDailyBest?: boolean;

  @ApiPropertyOptional({
    description:
      'Every track guessed right this run, oldest first (set when run ends)',
    type: [ActualTrackDto],
  })
  guessedTracks?: ActualTrackDto[];
}
