import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaylistSource } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsString, MaxLength } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { IsPlaylistLink } from '../validators/is-playlist-link.validator';

export class ImportPlaylistControllerDto {
  // Only Deezer can be read from. The enum carries the services a playlist can
  // have come from, which is a longer list than the ones we import from.
  @ApiProperty({ enum: [PlaylistSource.DEEZER] })
  @IsIn([PlaylistSource.DEEZER])
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
    description: 'Where the player says the playlist came from',
  })
  @IsNotNullableOptional()
  @IsEnum(PlaylistSource)
  origin?: PlaylistSource;
}
