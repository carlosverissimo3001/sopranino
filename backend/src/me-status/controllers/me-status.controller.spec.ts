import { SessionGuard } from '@utils/guards/session-guard';
import { MeStatusController } from './me-status.controller';

const guardsOn = (handler: keyof MeStatusController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    MeStatusController.prototype[handler],
  ) as unknown[]) ?? [];

describe('MeStatusController guards', () => {
  it('needs a session, which a guest has too', () => {
    expect(guardsOn('get')).toContain(SessionGuard);
  });
});
