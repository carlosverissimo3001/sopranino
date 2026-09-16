import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaylistSource } from '@prisma/client';
import { TrackGroupDto } from '../../track-group/dto/track-group.dto';

export class ImportedSetDto extends TrackGroupDto {
  @ApiProperty({ enum: PlaylistSource })
  source: PlaylistSource;

  @ApiProperty({ description: 'The playlist on its own service' })
  externalUrl: string;

  @ApiProperty({ description: 'Its songs have not been read yet' })
  pending: boolean;

  @ApiPropertyOptional({
    description:
      'When the playlist stopped being readable; its last songs are kept',
  })
  staleSince?: Date;
}
