import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString, MaxLength } from 'class-validator';
import { IsNotNullableOptional } from '@utils/decorators/notNullableOptional.decorator';

export enum SnippetPath {
  WebAudio = 'web-audio',
  Element = 'element',
}

/**
 * What the player's device was doing when they guessed. Recorded so a round
 * skipped in silence can be told apart from a round skipped in ignorance.
 */
export class GuessAudioDto {
  @ApiProperty({ description: 'Whether the snippet was started this round' })
  @IsBoolean()
  played: boolean;

  @ApiPropertyOptional({
    description: 'How the last snippet was played, when one was',
    enum: SnippetPath,
  })
  @IsNotNullableOptional()
  @IsEnum(SnippetPath)
  path?: SnippetPath;

  @ApiPropertyOptional({
    description:
      "The Web Audio context's state, including WebKit's `interrupted`",
    type: String,
  })
  @IsNotNullableOptional()
  @IsString()
  @MaxLength(16)
  contextState?: string;

  @ApiProperty({
    description:
      'Whether the silent element holding the iOS playback session is playing',
  })
  @IsBoolean()
  sessionHeld: boolean;

  @ApiPropertyOptional({ type: String })
  @IsNotNullableOptional()
  @IsString()
  @MaxLength(512)
  userAgent?: string;
}
