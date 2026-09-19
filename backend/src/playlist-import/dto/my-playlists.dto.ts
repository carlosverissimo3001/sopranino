import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaylistSource } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { PLAYLIST_SORT_BY, SORT_ORDER } from '../../playlist/consts';

export enum PlaylistItemKind {
  SPOTIFY = 'SPOTIFY',
  IMPORTED = 'IMPORTED',
}

export class GetMyPlaylistsDto {
  @ApiPropertyOptional({ enum: PLAYLIST_SORT_BY, enumName: 'PlaylistSortBy' })
  @IsNotNullableOptional()
  @IsEnum(PLAYLIST_SORT_BY)
  sortBy?: PLAYLIST_SORT_BY = PLAYLIST_SORT_BY.DEFAULT;

  @ApiPropertyOptional({
    enum: SORT_ORDER,
    enumName: 'SortOrder',
    description: 'Which way round, when the natural order is not wanted',
  })
  @IsNotNullableOptional()
  @IsEnum(SORT_ORDER)
  order?: SORT_ORDER;
}

export class PlaylistItemDto {
  @ApiProperty({ enum: PlaylistItemKind, enumName: 'PlaylistItemKind' })
  kind: PlaylistItemKind;

  @ApiProperty({
    description: 'The Spotify playlist id, or the set id of an import',
  })
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  trackCount: number;

  @ApiProperty({ description: 'The playlist on its own service' })
  externalUrl: string;

  @ApiPropertyOptional({ description: "The Spotify owner's name" })
  owner?: string;

  @ApiPropertyOptional({ description: 'Imports: the set page' })
  slug?: string;

  @ApiPropertyOptional({ enum: PlaylistSource })
  source?: PlaylistSource;

  @ApiPropertyOptional({
    enum: PlaylistSource,
    description: 'Imports: the service the copy was made from',
  })
  origin?: PlaylistSource;

  @ApiPropertyOptional({ description: 'Imports: songs not read yet' })
  pending?: boolean;

  @ApiPropertyOptional()
  staleSince?: Date;

  @ApiPropertyOptional({
    description: 'Imports: when its songs were last read',
  })
  refreshedAt?: Date;

  @ApiPropertyOptional({ description: 'Imports: its songs are being read now' })
  refreshing?: boolean;
}

export class MyPlaylistsDto {
  @ApiProperty({ type: [PlaylistItemDto] })
  items: PlaylistItemDto[];

  @ApiProperty({
    description:
      'Spotify could not be read this time; imports are still listed',
  })
  spotifyUnavailable: boolean;
}
