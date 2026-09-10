import { MultiplayerController } from './multiplayer.controller';
import { SessionGuard } from '@utils/guards/session-guard';

/**
 * The guards sit on the routes rather than the class, so a route added later
 * inherits nothing. Easy to get wrong by omission and impossible to see by
 * reading one decorator, so it is asserted rather than commented.
 */
const guardsOn = (handler: keyof MultiplayerController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    MultiplayerController.prototype[handler],
  ) as unknown[]) ?? [];

describe('MultiplayerController guards', () => {
  // Deciding whether to play should not require signing in first.
  it('leaves the lobby open', () => {
    expect(guardsOn('listOpenRooms')).toHaveLength(0);
  });

  it.each([
    'createRoom',
    'getRoomState',
    'joinRoom',
    'joinOpenRoom',
    'setTrackSource',
    'updateRoomSettings',
    'kickPlayer',
    'toggleReady',
    'startGame',
    'leaveRoom',
    'getRoundState',
    'submitGuess',
    'getScoreboard',
  ] as const)('still requires a session for %s', (handler) => {
    expect(guardsOn(handler)).toContain(SessionGuard);
  });

  // Only the list opened up. Everything a room holds stays behind a session.
  it('guards every route except the lobby', () => {
    const handlers = Object.getOwnPropertyNames(
      MultiplayerController.prototype,
    ).filter((name) => name !== 'constructor');

    const unguarded = handlers.filter(
      (name) => guardsOn(name as keyof MultiplayerController).length === 0,
    );

    expect(unguarded).toEqual(['listOpenRooms']);
  });
});
