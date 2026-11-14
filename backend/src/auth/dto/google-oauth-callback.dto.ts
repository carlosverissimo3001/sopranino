import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Everything Google appends to the redirect. The validation pipe refuses
 * unknown params, so each one has to be named or the callback 400s instead of
 * sending the player back to the app.
 */
export class GoogleOAuthCallbackDto {
  @ApiPropertyOptional({
    description: 'Authorization code. Absent when the user declined.',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'State parameter for CSRF protection' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Set when authorization failed' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ description: 'Scopes granted' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Index of the signed-in Google account' })
  @IsOptional()
  @IsString()
  authuser?: string;

  @ApiPropertyOptional({ description: 'Prompt Google showed' })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({ description: 'Workspace domain, for such accounts' })
  @IsOptional()
  @IsString()
  hd?: string;

  @ApiPropertyOptional({ description: 'Issuer of the authorization response' })
  @IsOptional()
  @IsString()
  iss?: string;
}
