import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';

export class GetRoundStateDto {
  @ApiPropertyOptional({
    description:
      'The round to show. Omitted, the player is given their furthest round.',
    minimum: 0,
  })
  @IsNotNullableOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  roundIndex?: number;
}
