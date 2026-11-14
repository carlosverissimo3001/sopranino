import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserSessionDto {
  @ApiProperty({ description: 'Unique identifier for the user session' })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Identifier of the user this session belongs to',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Spotify user ID, present only when the account is linked',
  })
  @IsOptional()
  @IsString()
  spotifyUserId?: string;

  @ApiPropertyOptional({
    description: 'Google subject id, present only when signed in with Google',
  })
  @IsOptional()
  @IsString()
  googleUserId?: string;

  @ApiPropertyOptional({
    description: 'Email, present only when the account was made with one',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Display name of the Spotify user' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Indicates if the user is trusted' })
  @IsBoolean()
  isTrusted: boolean;

  @ApiProperty({ description: 'Timestamp when the session was created' })
  @IsNumber()
  createdAt: number;
}
