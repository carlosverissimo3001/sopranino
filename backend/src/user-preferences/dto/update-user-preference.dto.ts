import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { IsIanaTimezone } from '@utils/decorators/isIanaTimezone.decorator';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';

export class UpdateUserPreferenceDto {
  @ApiPropertyOptional({
    description: 'Show progressively blurred album art hint',
  })
  @IsOptional()
  @IsBoolean()
  showAlbumHint?: boolean;

  @ApiPropertyOptional({
    description: 'Show genre, decade, and other text hints',
  })
  @IsOptional()
  @IsBoolean()
  showTextHints?: boolean;

  @ApiPropertyOptional({ description: 'Show guess history during gameplay' })
  @IsOptional()
  @IsBoolean()
  showGuessHistory?: boolean;

  @ApiPropertyOptional({
    description: 'Show this player by name on public leaderboards',
  })
  @IsOptional()
  @IsBoolean()
  showStatsToOthers?: boolean;

  @ApiPropertyOptional({
    description: 'IANA timezone string (e.g. America/New_York)',
  })
  @IsNotNullableOptional()
  @IsIanaTimezone()
  timezone?: string;
}
