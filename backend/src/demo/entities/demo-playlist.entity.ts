import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DemoPlaylistEntity {
  @ApiProperty({ description: 'Stable key used when starting a round' })
  slug: string;

  @ApiProperty({ description: 'Chart name shown in the picker' })
  name: string;

  @ApiProperty({ description: 'Chart cover art; empty until one is set' })
  imageUrl: string;

  @ApiPropertyOptional({ type: String })
  description: string | null;
}
