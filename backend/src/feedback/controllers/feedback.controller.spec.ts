import { ThrottlerGuard } from '@nestjs/throttler';
import { SessionGuard } from '@utils/guards/session-guard';
import { FeedbackController } from './feedback.controller';

const guardsOn = (handler: keyof FeedbackController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    FeedbackController.prototype[handler],
  ) as unknown[]) ?? [];

describe('FeedbackController guards', () => {
  // A player who cannot sign in is exactly who needs to report it.
  it('takes reports without a session, but throttled', () => {
    expect(guardsOn('submit')).toContain(ThrottlerGuard);
    expect(guardsOn('submit')).not.toContain(SessionGuard);
  });
});
