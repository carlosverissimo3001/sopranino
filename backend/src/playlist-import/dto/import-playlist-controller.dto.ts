import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaylistSource } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { IsPlaylistLink } from '../validators/is-playlist-link.validator';

export class ImportPlaylistControllerDto {
  @ApiProperty({ enum: PlaylistSource })
  @IsEnum(PlaylistSource)
  source: PlaylistSource;

  @ApiProperty({ example: 'https://www.deezer.com/playlist/1313621735' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(512)
  @IsPlaylistLink()
  link: string;

  @ApiPropertyOptional({
    enum: PlaylistSource,
    description: 'Where the player keeps the playlist, when the link is a copy',
  })
  @IsNotNullableOptional()
  @IsEnum(PlaylistSource)
  origin?: PlaylistSource;
}
