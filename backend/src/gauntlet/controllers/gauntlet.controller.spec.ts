import { GauntletController } from './gauntlet.controller';
import { SessionGuard } from '@utils/guards/session-guard';
import { ProvisioningSessionGuard } from '@utils/guards/provisioning-session.guard';

/**
 * The guards sit on the routes rather than the class, so a route added later
 * inherits nothing. That is easy to get wrong by omission and impossible to
 * see by reading one decorator, so it is asserted here instead.
 */
const guardsOn = (handler: keyof GauntletController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    GauntletController.prototype[handler],
  ) as unknown[]) ?? [];

describe('GauntletController guards', () => {
  // Anyone may read the board, including someone who has never played.
  it('leaves the leaderboard open', () => {
    expect(guardsOn('getLeaderboard')).toHaveLength(0);
  });

  // A first run should not require having played something else first.
  it('lets starting a run mint the session it needs', () => {
    expect(guardsOn('startRun')).toContain(ProvisioningSessionGuard);
    expect(guardsOn('startRun')).not.toContain(SessionGuard);
  });

  it.each([
    'submitGuess',
    'endRun',
    'getPersonalBest',
    'getHistory',
    'getRunState',
  ] as const)('still requires a session for %s', (handler) => {
    expect(guardsOn(handler)).toContain(SessionGuard);
  });
});
