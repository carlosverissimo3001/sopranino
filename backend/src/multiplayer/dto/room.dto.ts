import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RoomStatus,
  TrackSource,
  MultiplayerRoom,
  RoomPlayer,
  User,
} from '@prisma/client';
import { RoomPlayerDto } from './room-player.dto';
import { ROOM_MAX_PLAYERS } from '../../consts';

type RoomWithPlayers = MultiplayerRoom & {
  players: (RoomPlayer & {
    user: Pick<User, 'displayName' | 'avatarUrl'>;
  })[];
};

export class RoomDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  hostId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Whether the room is listed in the lobby' })
  findable: boolean;

  @ApiProperty({ description: 'Seats in the room, so a roster can read 12/20' })
  capacity: number;

  @ApiProperty()
  roundCount: number;

  @ApiProperty({ enum: RoomStatus })
  status: RoomStatus;

  @ApiProperty({
    enum: TrackSource,
    description: 'Where this room draws its songs from',
  })
  trackSource: TrackSource;

  @ApiProperty({ type: [RoomPlayerDto] })
  players: RoomPlayerDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: Date })
  startedAt?: Date;

  @ApiPropertyOptional({ type: Date })
  completedAt?: Date;

  static fromEntity(room: RoomWithPlayers): RoomDto {
    return {
      id: room.id,
      inviteCode: room.inviteCode,
      hostId: room.hostId,
      name: room.name,
      findable: room.findable,
      capacity: ROOM_MAX_PLAYERS,
      roundCount: room.roundCount,
      status: room.status,
      trackSource: room.trackSource,
      players: room.players.map(RoomPlayerDto.fromEntity),
      createdAt: room.createdAt,
      startedAt: room.startedAt ?? undefined,
      completedAt: room.completedAt ?? undefined,
    };
  }
}
