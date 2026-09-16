import { ApiProperty } from '@nestjs/swagger';
import { PlaylistSource } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength } from 'class-validator';
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
}
