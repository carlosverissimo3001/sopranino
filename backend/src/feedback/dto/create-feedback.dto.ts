import { ApiProperty } from '@nestjs/swagger';
import { FeedbackKind } from '@prisma/client';

/** What the service hands the repository: the body plus what the server knows. */
export class CreateFeedbackDto {
  @ApiProperty()
  kind: FeedbackKind;

  @ApiProperty()
  message: string;

  @ApiProperty()
  normalizedMessage?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  userId?: string;

  @ApiProperty()
  pagePath?: string;

  @ApiProperty()
  appVersion?: string;

  @ApiProperty()
  userAgent?: string;
}
