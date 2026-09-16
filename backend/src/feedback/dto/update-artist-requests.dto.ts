import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toBoolean } from '@utils/transformers/toBoolean.transform';
import { FEEDBACK_REQUEST_MAX } from '../consts';

export class UpdateArtistRequestsDto {
  @ApiProperty({
    description: 'The grouping key, as the requests list returns it',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(FEEDBACK_REQUEST_MAX)
  key: string;

  @ApiProperty({ description: 'Resolved once the set exists, or reopened' })
  @Transform(({ obj }) => toBoolean(obj.resolved))
  @IsBoolean()
  resolved: boolean;
}
