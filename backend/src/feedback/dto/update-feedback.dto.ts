import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { toBoolean } from '@utils/transformers/toBoolean.transform';

export class UpdateFeedbackDto {
  @ApiProperty({ description: 'Resolved, or reopened' })
  @Transform(({ obj }) => toBoolean(obj.resolved))
  @IsBoolean()
  resolved: boolean;
}
