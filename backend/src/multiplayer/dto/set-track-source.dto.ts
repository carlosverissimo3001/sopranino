import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackSource } from '@prisma/client';
import { IsEnum, IsUUID, ValidateIf } from 'class-validator';

export class SetTrackSourceDto {
  @ApiProperty({
    enum: TrackSource,
    description: 'Where the room should draw its songs from',
  })
  @IsEnum(TrackSource)
  trackSource: TrackSource;

  @ApiPropertyOptional({
    description: 'The set to draw from, required when the source is a set',
  })
  @ValidateIf((dto: SetTrackSourceDto) => dto.trackSource === TrackSource.SET)
  @IsUUID()
  trackGroupId?: string;
}
