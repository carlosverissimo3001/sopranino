import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export enum DemoRoundStatus {
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export class DemoPlaylistDto {
  @ApiProperty({ description: 'Stable key used when starting a round' })
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Chart cover art; empty until one is set',
  })
  imageUrl: string;

  @ApiPropertyOptional({ type: String })
  description: string | null;
}

export class DemoOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  artistName: string;
}

export class DemoAnswerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  artistName: string;

  @ApiProperty()
  albumImageUrl: string;
}

export class StartDemoRoundDto {
  @ApiProperty({ description: 'Playlist slug, e.g. "pt"' })
  @IsString()
  @IsNotEmpty()
  playlistSlug: string;
}

export class DemoRoundDto {
  @ApiProperty({ description: 'Opaque round id. Not a session.' })
  roundId: string;

  @ApiProperty()
  previewUrl: string;

  @ApiProperty({ description: '1-based attempt number' })
  attempt: number;

  @ApiProperty()
  totalAttempts: number;

  @ApiProperty({ description: 'Seconds of audio unlocked so far' })
  snippetDuration: number;

  @ApiProperty({
    type: [Number],
    description: 'Seconds unlocked at each attempt, so a client can mark them',
  })
  snippetSteps: number[];

  @ApiProperty({ type: [DemoOptionDto] })
  options: DemoOptionDto[];
}

export class GuessDemoDto {
  @ApiProperty({ description: 'Track id; must be one of the options' })
  @IsString()
  @IsNotEmpty()
  trackId: string;
}

export class DemoGuessResultDto {
  @ApiProperty()
  correct: boolean;

  @ApiProperty({ enum: DemoRoundStatus })
  status: DemoRoundStatus;

  @ApiProperty()
  attempt: number;

  @ApiProperty()
  totalAttempts: number;

  @ApiProperty()
  snippetDuration: number;

  @ApiProperty({ type: [String] })
  wrongIds: string[];

  @ApiPropertyOptional({
    type: DemoAnswerDto,
    description: 'Only present once the round is won or lost',
  })
  answer?: DemoAnswerDto;
}
