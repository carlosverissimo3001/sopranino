import { ApiProperty } from '@nestjs/swagger';
import { GuessResult } from '../../consts';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuessAudioDto } from './guess-audio.dto';

export class GuessHistoryDto {
  @ApiPropertyOptional({ description: 'The ID of the track', type: String })
  trackId?: string;

  @ApiPropertyOptional({ description: 'The name of the track', type: String })
  trackName?: string;

  @ApiPropertyOptional({ description: 'The artist of the track', type: String })
  artistName?: string;

  @ApiProperty({ description: 'The result of the guess', enum: GuessResult })
  result: GuessResult;

  @ApiPropertyOptional({ type: GuessAudioDto })
  audio?: GuessAudioDto;
}
