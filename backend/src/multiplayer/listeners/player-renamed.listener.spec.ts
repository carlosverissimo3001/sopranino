import { Test } from '@nestjs/testing';
import { RoomRepository } from '../repositories/room.repository';
import { RoomsGateway } from '../gateways/rooms.gateway';
import { UserRenamedEvent } from '../../auth/events/user-renamed.event';
import { PlayerRenamedListener } from './player-renamed.listener';

const room = (id: string) => ({
  id,
  inviteCode: 'CODE',
  hostId: 'host',
  name: 'Sunlit Bridge',
  findable: true,
  maxPlayers: 20,
  roundCount: 5,
  status: 'WAITING',
  trackSource: 'POOL',
  trackGroupId: null,
  trackGroup: null,
  players: [],
  createdAt: new Date(),
  startedAt: null,
  completedAt: null,
  finishDeadline: null,
});

describe('PlayerRenamedListener', () => {
  const rooms = {
    findLiveRoomIdsForPlayer: jest.fn(),
    findById: jest.fn(),
  };
  const gateway = { emitRoomUpdate: jest.fn(), standingsChanged: jest.fn() };
  let listener: PlayerRenamedListener;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PlayerRenamedListener,
        { provide: RoomRepository, useValue: rooms },
        { provide: RoomsGateway, useValue: gateway },
      ],
    }).compile();
    listener = module.get(PlayerRenamedListener);
  });

  it('re-sends every room the player is still in, and its scoreboard', async () => {
    rooms.findLiveRoomIdsForPlayer.mockResolvedValue(['room-1', 'room-2']);
    rooms.findById.mockImplementation((id: string) =>
      Promise.resolve(room(id)),
    );

    await listener.handle(new UserRenamedEvent('user-1', 'Other Charly'));

    expect(gateway.emitRoomUpdate).toHaveBeenCalledTimes(2);
    expect(gateway.emitRoomUpdate).toHaveBeenCalledWith(
      'room-1',
      expect.objectContaining({ id: 'room-1' }),
    );
    expect(gateway.standingsChanged).toHaveBeenCalledWith('room-2');
  });

  it('says nothing when the player is in no room', async () => {
    rooms.findLiveRoomIdsForPlayer.mockResolvedValue([]);

    await listener.handle(new UserRenamedEvent('user-1', 'Other Charly'));

    expect(gateway.emitRoomUpdate).not.toHaveBeenCalled();
  });
});
