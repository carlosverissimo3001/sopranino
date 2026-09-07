import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarSource } from '@prisma/client';

export class UserEntity {
  @ApiProperty({ description: 'Unique identifier for the user' })
  id: string;

  @ApiPropertyOptional({
    description: 'Unique identifier for the user on Spotify, when linked',
  })
  spotifyUserId?: string;

  @ApiPropertyOptional({
    description: 'Email address, when the account was created with one',
  })
  email?: string;

  /** Never leaves the backend; excluded from every response DTO. */
  passwordHash?: string;

  @ApiPropertyOptional({
    description:
      'When the address was proved. Absent means the address is claimed but not owned.',
  })
  emailVerifiedAt?: Date;

  @ApiProperty({ description: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({ description: 'https://example.com/avatar.jpg' })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Cloudinary URL of uploaded custom avatar',
  })
  customAvatarUrl?: string;

  @ApiProperty({ enum: AvatarSource })
  avatarSource: AvatarSource;

  @ApiProperty({ description: 'Indicates if the user is trusted' })
  isTrusted: boolean;

  @ApiProperty({ description: 'Indicates if the user is an admin' })
  isAdmin: boolean;

  @ApiProperty({ description: 'Date when the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the user was last updated' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description:
      "The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code.",
  })
  country?: string;

  @ApiProperty({ description: 'Unused streak freezes the user is holding' })
  streakFreezes: number;

  @ApiProperty({
    description: 'Streak quiz questions already answered, so none repeats',
    type: String,
    isArray: true,
  })
  answeredQuestionIds: string[];
}
