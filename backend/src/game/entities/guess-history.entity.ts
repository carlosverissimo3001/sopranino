import { ApiProperty } from '@nestjs/swagger';
import { GuessResult } from '../consts';

export class GuessHistoryEntity {
  @ApiProperty({ description: 'The ID of the guess' })
  result: GuessResult;

  @ApiProperty({ description: 'The ID of the track' })
  trackId: string;

  @ApiProperty({ description: 'The name of the track' })
  trackName: string;

  @ApiProperty({ description: 'The artist of the track' })
  artistName: string;

  @ApiProperty({ description: 'The album of the track', required: false })
  albumName?: string;
}
