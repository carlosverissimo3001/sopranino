import { PlaylistSource } from '@prisma/client';
import { registerDecorator, ValidationArguments } from 'class-validator';
import { parsePlaylistLink } from '../links';

export const SOURCE_NAMES: Record<PlaylistSource, string> = {
  [PlaylistSource.DEEZER]: 'Deezer',
  [PlaylistSource.SPOTIFY]: 'Spotify',
  [PlaylistSource.APPLE_MUSIC]: 'Apple Music',
  [PlaylistSource.YOUTUBE_MUSIC]: 'YouTube Music',
};

export function IsPlaylistLink(): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'isPlaylistLink',
      target: target.constructor,
      propertyName: propertyName as string,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const { source } = args.object as { source?: PlaylistSource };
          return (
            typeof value === 'string' &&
            !!source &&
            source in SOURCE_NAMES &&
            parsePlaylistLink(source, value) !== null
          );
        },
        defaultMessage(args: ValidationArguments) {
          const { source } = args.object as { source?: PlaylistSource };
          const name = source && SOURCE_NAMES[source];
          return name
            ? `That is not a ${name} playlist link`
            : 'That is not a playlist link';
        },
      },
    });
  };
}
