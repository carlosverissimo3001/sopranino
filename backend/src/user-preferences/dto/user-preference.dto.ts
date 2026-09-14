import { ApiProperty } from '@nestjs/swagger';

export class UserPreferenceDto {
  @ApiProperty({ description: 'Show progressively blurred album art hint' })
  showAlbumHint: boolean;

  @ApiProperty({ description: 'Show genre, decade, and other text hints' })
  showTextHints: boolean;

  @ApiProperty({ description: 'Show guess history during gameplay' })
  showGuessHistory: boolean;

  @ApiProperty({
    description:
      'Show this player by name on public leaderboards. Off by default: a player ranks anonymously until they choose to be named.',
  })
  showStatsToOthers: boolean;

  @ApiProperty({
    description: 'IANA timezone string (e.g. America/New_York)',
    default: 'UTC',
  })
  timezone: string;
}
