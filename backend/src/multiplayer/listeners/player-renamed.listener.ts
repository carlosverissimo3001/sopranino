import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  USER_RENAMED,
  UserRenamedEvent,
} from '../../auth/events/user-renamed.event';
import { RoomRepository } from '../repositories/room.repository';
import { RoomsGateway } from '../gateways/rooms.gateway';
import { RoomDto } from '../dto/room.dto';

/** An hour covers a results screen somebody is still looking at. */
const RECENT_RESULTS_MS = 60 * 60 * 1000;

/**
 * Tells every room a player is in that their name changed. Each client keeps
 * the roster it was last sent, so without this only the player who renamed
 * would see the new name.
 */
@Injectable()
export class PlayerRenamedListener {
  constructor(
    private readonly roomRepository: RoomRepository,
    @Inject(forwardRef(() => RoomsGateway))
    private readonly roomsGateway: RoomsGateway,
  ) {}

  @OnEvent(USER_RENAMED, { async: true })
  async handle({ userId }: UserRenamedEvent): Promise<void> {
    const roomIds = await this.roomRepository.findLiveRoomIdsForPlayer(
      userId,
      new Date(Date.now() - RECENT_RESULTS_MS),
    );

    for (const roomId of roomIds) {
      const room = await this.roomRepository.findById(roomId);
      if (!room) continue;
      this.roomsGateway.emitRoomUpdate(roomId, RoomDto.fromEntity(room));
      // The scoreboard names players too.
      this.roomsGateway.standingsChanged(roomId);
    }
  }
}
