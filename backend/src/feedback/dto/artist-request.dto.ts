import { ApiProperty } from '@nestjs/swagger';
import { Paginated } from '../../utils/pagination/paginated.dto';

export class ArtistRequestDto {
  @ApiProperty({ description: 'As most recently typed, not the grouping key' })
  name: string;

  @ApiProperty({ description: 'How many people have asked for it' })
  count: number;

  @ApiProperty()
  lastAskedAt: Date;
}

export class ArtistRequestPageDto extends Paginated(ArtistRequestDto) {}
