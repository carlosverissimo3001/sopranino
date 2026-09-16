import { ApiProperty } from '@nestjs/swagger';
import { Paginated } from '../../utils/pagination/paginated.dto';

export class ArtistRequestDto {
  @ApiProperty({
    description: 'What the asks are grouped by; pass it back to resolve them',
  })
  key: string;

  @ApiProperty({ description: 'As most recently typed, not the grouping key' })
  name: string;

  @ApiProperty({ description: 'How many people have asked for it' })
  count: number;

  @ApiProperty()
  lastAskedAt: Date;

  @ApiProperty({ description: 'Every ask under the name has been resolved' })
  resolved: boolean;
}

export class ArtistRequestPageDto extends Paginated(ArtistRequestDto) {}
