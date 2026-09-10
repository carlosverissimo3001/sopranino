import { ApiProperty } from '@nestjs/swagger';
import { TrackSource } from '@prisma/client';

export class OpenRoomDto {
  @ApiProperty({ description: 'Room id, to join by' })
  id: string;

  @ApiProperty({ description: 'The room`s name' })
  name: string;

  @ApiProperty({ description: 'How many players are in it right now' })
  playerCount: number;

  @ApiProperty({ description: 'Rounds the host chose' })
  roundCount: number;

  @ApiProperty({
    description: 'Whether it draws on the curated pool or on linked libraries',
    enum: TrackSource,
  })
  trackSource: TrackSource;
}

export class OpenRoomsDto {
  @ApiProperty({ type: [OpenRoomDto] })
  rooms: OpenRoomDto[];
}
