import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/services/auth.service';
import { SessionService } from '../../auth/services/session.service';
import { RoomRepository } from '../repositories/room.repository';
import { RoomPresenceService } from '../services/room-presence.service';
import { MultiplayerGameService } from '../services/multiplayer-game.service';
import { RoomService } from '../services/room.service';
import { ChatService } from '../services/chat.service';
import { ModerationService } from '../../moderation/services/moderation.service';
import { RoomsGateway } from './rooms.gateway';

describe('RoomsGateway chat', () => {
  const rooms = { isChatEnabled: jest.fn() };
  const chat = {
    clean: jest.fn((text: string) => text.trim()),
    isMuted: jest.fn().mockResolvedValue(false),
    append: jest.fn(),
  };
  const moderation = { judge: jest.fn() };
  let gateway: RoomsGateway;

  const client = (roomId: string) =>
    ({
      data: { userId: 'user-1', displayName: 'Charly' },
      rooms: new Set([roomId]),
      emit: jest.fn(),
    }) as never;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RoomsGateway,
        { provide: SessionService, useValue: {} },
        { provide: AuthService, useValue: {} },
        { provide: RoomRepository, useValue: rooms },
        { provide: RoomPresenceService, useValue: {} },
        { provide: MultiplayerGameService, useValue: {} },
        { provide: RoomService, useValue: {} },
        { provide: ChatService, useValue: chat },
        { provide: ModerationService, useValue: moderation },
        { provide: ConfigService, useValue: { get: () => 'true' } },
      ],
    }).compile();
    gateway = module.get(RoomsGateway);
    (gateway as unknown as { server: unknown }).server = {
      to: () => ({ emit: jest.fn() }),
    };
  });

  // A client that missed the update still has a text box; the server is
  // what keeps the room quiet.
  it('refuses a message to a room whose host closed the chat', async () => {
    rooms.isChatEnabled.mockResolvedValue(false);
    const sender = client('room-1');

    await gateway.handleSendMessage(sender, { roomId: 'room-1', text: 'hi' });

    expect((sender as { emit: jest.Mock }).emit).toHaveBeenCalledWith(
      'messageRefused',
      { reason: 'closed' },
    );
    expect(moderation.judge).not.toHaveBeenCalled();
    expect(chat.append).not.toHaveBeenCalled();
  });

  it('lets a message through while the chat is open', async () => {
    rooms.isChatEnabled.mockResolvedValue(true);
    moderation.judge.mockResolvedValue({ verdict: 'allow' });
    chat.append.mockResolvedValue({ id: 'm1' });

    await gateway.handleSendMessage(client('room-1'), {
      roomId: 'room-1',
      text: 'hi',
    });

    expect(chat.append).toHaveBeenCalled();
  });
});
