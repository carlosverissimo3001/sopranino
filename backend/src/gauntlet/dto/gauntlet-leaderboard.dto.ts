import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GauntletDifficulty } from '@prisma/client';

export class GauntletLeaderboardEntryDto {
  @ApiProperty({ description: 'Rank position (1-based)' })
  rank: number;

  @ApiProperty({
    description:
      'User ID. Opaque placeholder for a hidden entry, so the row cannot be traced back to a player.',
  })
  userId: string;

  @ApiProperty({ description: 'User display name' })
  displayName: string;

  @ApiProperty({
    description: 'This player chose not to be named on the leaderboard',
  })
  isHidden: boolean;

  @ApiPropertyOptional({ description: 'User avatar URL', type: String })
  avatarUrl?: string;

  @ApiProperty({ description: 'Best score achieved in the period' })
  score: number;

  @ApiPropertyOptional({
    description:
      'The curated group the run was set on. Absent when it drew on the whole pool.',
    type: String,
  })
  trackGroupName?: string;
}

export class GauntletUserLeaderboardEntryDto {
  @ApiProperty({ description: 'Rank position (1-based)' })
  rank: number;

  @ApiProperty({ description: 'Best score in the period' })
  score: number;
}

export class GauntletLeaderboardDto {
  @ApiProperty({ type: [GauntletLeaderboardEntryDto] })
  entries: GauntletLeaderboardEntryDto[];

  @ApiPropertyOptional({
    description: "Requesting user's leaderboard position",
    type: GauntletUserLeaderboardEntryDto,
  })
  userEntry?: GauntletUserLeaderboardEntryDto;

  @ApiProperty({
    description: 'The period this leaderboard covers',
    enum: ['daily', 'weekly', 'alltime'],
  })
  period: 'daily' | 'weekly' | 'alltime';

  @ApiProperty({
    description: 'The difficulty this leaderboard ranks',
    enum: GauntletDifficulty,
  })
  difficulty: GauntletDifficulty;
}
