import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Feedback, FeedbackKind, User } from '@prisma/client';

export class FeedbackDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: FeedbackKind })
  kind: FeedbackKind;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  userDisplayName?: string;

  @ApiPropertyOptional()
  pagePath?: string;

  @ApiPropertyOptional()
  userAgent?: string;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(
    entity: Feedback & { user: Pick<User, 'displayName'> | null },
  ): FeedbackDto {
    return {
      id: entity.id,
      kind: entity.kind,
      message: entity.message,
      email: entity.email ?? undefined,
      userId: entity.userId ?? undefined,
      userDisplayName: entity.user?.displayName ?? undefined,
      pagePath: entity.pagePath ?? undefined,
      userAgent: entity.userAgent ?? undefined,
      resolvedAt: entity.resolvedAt ?? undefined,
      createdAt: entity.createdAt,
    };
  }
}
