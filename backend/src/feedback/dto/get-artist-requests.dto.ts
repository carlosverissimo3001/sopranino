import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { toBoolean } from '@utils/transformers/toBoolean.transform';
import { PaginationQueryDto } from '../../utils/pagination/pagination-query.dto';

export class GetArtistRequestsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Only asks already acted on, or only open ones',
  })
  @IsNotNullableOptional()
  @Transform(({ obj }) => toBoolean(obj.resolved))
  @IsBoolean()
  resolved?: boolean;
}
