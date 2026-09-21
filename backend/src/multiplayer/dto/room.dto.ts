import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RoomStatus,
  TrackSource,
  MultiplayerRoom,
  RoomPlayer,
  TrackGroup,
  User,
} from '@prisma/client';
import { RoomPlayerDto } from './room-player.dto';

type RoomWithPlayers = MultiplayerRoom & {
  trackGroup?: Pick<TrackGroup, 'name' | 'type'> | null;
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

  @ApiPropertyOptional({ description: 'The set a set room draws from' })
  trackGroupId?: string;

  @ApiPropertyOptional({
    description: 'That set`s name, for the lobby to show',
  })
  trackGroupName?: string;

  @ApiProperty({ type: [RoomPlayerDto] })
  players: RoomPlayerDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: Date })
  startedAt?: Date;

  @ApiPropertyOptional({ type: Date })
  completedAt?: Date;

  @ApiProperty({ description: 'Whether the room has a chat' })
  chatEnabled: boolean;

  @ApiPropertyOptional({
    type: Date,
    description:
      'Somebody has played the room out: when the rest stop being waited on',
  })
  finishDeadline?: Date;

  static fromEntity(room: RoomWithPlayers): RoomDto {
    return {
      id: room.id,
      inviteCode: room.inviteCode,
      hostId: room.hostId,
      name: room.name,
      findable: room.findable,
      capacity: room.maxPlayers,
      roundCount: room.roundCount,
      status: room.status,
      trackSource: room.trackSource,
      trackGroupId: room.trackGroupId ?? undefined,
      trackGroupName: room.trackGroup?.name,
      players: room.players.map(RoomPlayerDto.fromEntity),
      createdAt: room.createdAt,
      startedAt: room.startedAt ?? undefined,
      completedAt: room.completedAt ?? undefined,
      chatEnabled: room.chatEnabled,
      finishDeadline: room.finishDeadline ?? undefined,
    };
  }
}
