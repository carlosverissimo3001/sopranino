import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackKind } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';
import { FEEDBACK_MESSAGE_MAX, FEEDBACK_MESSAGE_MIN } from '../consts';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateFeedbackControllerDto {
  @ApiProperty({ enum: FeedbackKind })
  @IsEnum(FeedbackKind)
  kind: FeedbackKind;

  @ApiProperty({
    minLength: FEEDBACK_MESSAGE_MIN,
    maxLength: FEEDBACK_MESSAGE_MAX,
  })
  @Transform(trim)
  @IsString()
  @MinLength(FEEDBACK_MESSAGE_MIN)
  @MaxLength(FEEDBACK_MESSAGE_MAX)
  message: string;

  @ApiPropertyOptional({ description: 'Where to reply, if anywhere' })
  @IsNotNullableOptional()
  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ description: 'The page the report was sent from' })
  @IsNotNullableOptional()
  @IsString()
  @MaxLength(512)
  pagePath?: string;

  @ApiPropertyOptional({
    description: 'The app release the report was sent from',
  })
  @IsNotNullableOptional()
  @IsString()
  @MaxLength(32)
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'Left empty by people; a filled one is dropped silently',
  })
  @IsNotNullableOptional()
  @IsString()
  @MaxLength(256)
  website?: string;
}
