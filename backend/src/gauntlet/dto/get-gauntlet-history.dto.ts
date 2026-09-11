import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { GauntletDifficulty } from '@prisma/client';
import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';
import { PaginationQueryDto } from '@/utils/pagination/pagination-query.dto';

export class GetGauntletHistoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by difficulty',
    enum: GauntletDifficulty,
  })
  @IsNotNullableOptional()
  @IsEnum(GauntletDifficulty)
  difficulty?: GauntletDifficulty;
}
