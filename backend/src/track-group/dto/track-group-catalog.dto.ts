import { ApiProperty } from '@nestjs/swagger';
import { TrackGroupDto } from './track-group.dto';

/** Every kind a picker shows, in one answer instead of one per kind. */
export class TrackGroupCatalogDto {
  @ApiProperty({ type: [TrackGroupDto] })
  artist: TrackGroupDto[];

  @ApiProperty({ type: [TrackGroupDto] })
  decade: TrackGroupDto[];

  @ApiProperty({ type: [TrackGroupDto] })
  genre: TrackGroupDto[];

  @ApiProperty({ type: [TrackGroupDto] })
  chart: TrackGroupDto[];

  @ApiProperty({
    type: [TrackGroupDto],
    description: 'Empty for everyone the special sets were not made for',
  })
  special: TrackGroupDto[];
}
