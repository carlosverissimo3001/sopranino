import { PlaylistSource } from '@prisma/client';
import { registerDecorator } from 'class-validator';
import { parsePlaylistLink } from '../links';

export function IsPlaylistLink(): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isPlaylistLink',
      target: target.constructor,
      propertyName: propertyName as string,
      validator: {
        // Only a Deezer link is ever read. Every other service is an origin
        // the player names, and reaches us as a copy on Deezer.
        validate(value: unknown) {
          return (
            typeof value === 'string' &&
            parsePlaylistLink(PlaylistSource.DEEZER, value) !== null
          );
        },
        defaultMessage() {
          return 'That is not a Deezer playlist link';
        },
      },
    });
  };
}
