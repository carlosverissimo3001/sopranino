import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PkceStateDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  codeVerifier: string;

  /**
   * Set when a signed-in player started this flow to link a provider to their
   * account, rather than to sign in with it.
   */
  @IsOptional()
  @IsString()
  linkUserId?: string;

  @ApiProperty({ example: 1715328000 })
  @IsNumber()
  createdAt: number;
}
