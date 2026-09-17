import { ThrottlerGuard } from '@nestjs/throttler';
import { SignedUpGuard } from '@utils/guards/signed-up.guard';
import { PlaylistImportController } from './playlist-import.controller';

const guardsOn = (handler: keyof PlaylistImportController): unknown[] =>
  (Reflect.getMetadata(
    '__guards__',
    PlaylistImportController.prototype[handler],
  ) as unknown[]) ?? [];

describe('PlaylistImportController guards', () => {
  it.each(['import', 'refresh', 'leave', 'quota'] as const)(
    '%s needs a finished sign-up',
    (handler) => {
      expect(guardsOn(handler)).toContain(SignedUpGuard);
    },
  );

  it.each(['import', 'refresh'] as const)('throttles %s', (handler) => {
    expect(guardsOn(handler)).toContain(ThrottlerGuard);
  });
});
