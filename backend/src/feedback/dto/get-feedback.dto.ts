import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { toBoolean } from '@utils/transformers/toBoolean.transform';
import { PaginationQueryDto } from '../../utils/pagination/pagination-query.dto';

export class GetFeedbackDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: FeedbackKind })
  @IsNotNullableOptional()
  @IsEnum(FeedbackKind)
  kind?: FeedbackKind;

  @ApiPropertyOptional({ description: 'Only resolved, or only open, reports' })
  @IsNotNullableOptional()
  // The raw value: implicit conversion has already turned "false" into true.
  @Transform(({ obj }) => toBoolean(obj.resolved))
  @IsBoolean()
  resolved?: boolean;
}
