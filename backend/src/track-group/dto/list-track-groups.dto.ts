import { ApiPropertyOptional } from '@nestjs/swagger';
import { TrackGroupType } from '@prisma/client';
import { IsIn, IsOptional } from 'class-validator';

const LISTABLE_TYPES = Object.values(TrackGroupType).filter(
  (type) => type !== TrackGroupType.IMPORTED,
);

export class ListTrackGroupsDto {
  @ApiPropertyOptional({
    enum: LISTABLE_TYPES,
    description: 'Which axis to list',
  })
  @IsOptional()
  @IsIn(LISTABLE_TYPES)
  type?: TrackGroupType;
}
