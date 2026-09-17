import { ThrottlerGuard } from '@nestjs/throttler';
import { SignedUpGuard } from '@utils/guards/signed-up.guard';
import { PlaylistImportController } from './playlist-import.controller';

const guardsOn = (handler: keyof PlaylistImportController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    PlaylistImportController.prototype[handler],
  ) as unknown[]) ?? [];

describe('PlaylistImportController guards', () => {
  it.each(['import', 'leave'] as const)(
    '%s needs a finished sign-up',
    (handler) => {
      expect(guardsOn(handler)).toContain(SignedUpGuard);
    },
  );

  it('throttles importing', () => {
    expect(guardsOn('import')).toContain(ThrottlerGuard);
  });
});
