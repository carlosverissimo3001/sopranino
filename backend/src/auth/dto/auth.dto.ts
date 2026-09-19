import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarSource } from '@prisma/client';
import { UserPreferenceDto } from '../../user-preferences/dto/user-preference.dto';

export class AuthMeResponseDto {
  @ApiProperty({
    description: 'Stable user id, the only safe way to identify this player',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Spotify user ID, present only when the account is linked',
  })
  spotifyUserId?: string;

  @ApiProperty({
    example: false,
    description:
      'Whether any credential is attached. False means an anonymous player, who has nothing to log out of.',
  })
  hasLinkedAccount: boolean;

  @ApiProperty({
    example: false,
    description:
      'Whether this player has any credential at all, Spotify or email. False means an anonymous player whose progress lives on this device.',
  })
  hasAccount: boolean;

  @ApiPropertyOptional({
    description: 'Email of the account, when it was created with one',
  })
  email?: string;

  @ApiProperty({
    example: false,
    description:
      'Whether the address has been proved. False on an account with no email at all, and on one whose address is only claimed.',
  })
  emailVerified: boolean;

  @ApiPropertyOptional({
    description:
      'An address waiting to replace the email, until its link is clicked',
  })
  pendingEmail?: string;

  @ApiProperty({
    type: UserPreferenceDto,
    description:
      'The player preferences, here so pages need not ask for them separately',
  })
  preferences: UserPreferenceDto;

  @ApiProperty({ description: 'John Doe' })
  displayName: string;

  @ApiPropertyOptional({
    description:
      'Effective avatar URL for display (resolves to custom or Spotify)',
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Cloudinary URL of the custom avatar, if uploaded',
  })
  customAvatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Spotify avatar URL from the user profile',
  })
  spotifyAvatarUrl?: string;

  @ApiProperty({
    enum: AvatarSource,
    description: 'Which avatar source is currently active',
  })
  avatarSource: AvatarSource;

  @ApiProperty({ example: false })
  isTrusted: boolean;

  @ApiProperty({ example: false })
  isAdmin: boolean;

  @ApiPropertyOptional({
    description:
      "The country of the user, as set in the user's account profile. An ISO 3166-1 alpha-2 country code.",
  })
  country?: string;
}
