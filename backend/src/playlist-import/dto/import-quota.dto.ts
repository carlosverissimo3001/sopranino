import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportQuotaDto {
  @ApiProperty({ description: 'Playlist reads left today' })
  left: number;

  @ApiProperty({ description: 'Reads a player gets each day' })
  limit: number;

  @ApiPropertyOptional({ description: 'Seconds until the count starts over' })
  resetsIn?: number;
}
