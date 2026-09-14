import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { FameTier, GameMode } from '@prisma/client';

export class StartGameDto {
  @ApiPropertyOptional({
    description: 'The ID of the playlist to start the game with',
  })
  @IsNotNullableOptional()
  @IsString()
  @IsNotEmpty()
  playlistId?: string;

  @ApiPropertyOptional({
    description:
      'A curated group to draw from, for a player with no library of their own. Takes precedence over playlistId.',
  })
  @IsNotNullableOptional()
  @IsString()
  @IsNotEmpty()
  trackGroupId?: string;

  @ApiPropertyOptional({
    description:
      'How well-known the songs should be, for a pool or group game. Easy when absent.',
    enum: FameTier,
    enumName: 'FameTier',
  })
  @IsNotNullableOptional()
  @IsEnum(FameTier)
  fameTier?: FameTier;

  @ApiProperty({
    description: 'The game mode to start (all or daily)',
    enum: GameMode,
  })
  @IsEnum(GameMode)
  mode: GameMode;
}
