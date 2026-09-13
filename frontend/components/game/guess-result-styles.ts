import { GuessHistoryDtoResultEnum } from '@/sdk/models/GuessHistoryDto';

type GuessResultStyle = {
  label: string;
  barClass: string;
  cardClass: string;
  badgeClass: string;
  accentClass: string;
  dotClass: string;
};

export const GUESS_RESULT_STYLE: Record<
  GuessHistoryDtoResultEnum,
  GuessResultStyle
> = {
  [GuessHistoryDtoResultEnum.Correct]: {
    label: 'Correct',
    barClass: 'bg-green-500',
    cardClass: 'bg-green-500/20 border-green-500/50',
    badgeClass: 'bg-green-500/30 text-green-300 border-green-500/60',
    accentClass: 'border-l-green-500',
    dotClass: 'bg-green-500',
  },
  [GuessHistoryDtoResultEnum.Artist]: {
    label: 'Right artist',
    barClass: 'bg-yellow-500',
    cardClass: 'bg-yellow-500/20 border-yellow-500/50',
    badgeClass: 'bg-yellow-500/30 text-yellow-200 border-yellow-500/60',
    accentClass: 'border-l-yellow-500',
    dotClass: 'bg-yellow-500',
  },
  [GuessHistoryDtoResultEnum.Album]: {
    label: 'Right album',
    barClass: 'bg-amber-500',
    cardClass: 'bg-amber-500/20 border-amber-500/50',
    badgeClass: 'bg-amber-500/30 text-amber-200 border-amber-500/60',
    accentClass: 'border-l-amber-500',
    dotClass: 'bg-amber-500',
  },
  [GuessHistoryDtoResultEnum.ArtistAndAlbum]: {
    label: 'Right artist & album',
    barClass: 'bg-orange-500',
    cardClass: 'bg-orange-500/20 border-orange-500/50',
    badgeClass: 'bg-orange-500/30 text-orange-200 border-orange-500/60',
    accentClass: 'border-l-orange-500',
    dotClass: 'bg-orange-500',
  },
  [GuessHistoryDtoResultEnum.Wrong]: {
    label: 'Wrong',
    barClass: 'bg-red-500',
    cardClass: 'bg-red-500/20 border-red-500/50',
    badgeClass: 'bg-red-500/30 text-red-200 border-red-500/60',
    accentClass: 'border-l-red-500',
    dotClass: 'bg-red-500',
  },
  [GuessHistoryDtoResultEnum.Skip]: {
    label: 'Skipped',
    barClass: 'bg-gray-500',
    cardClass: 'bg-gray-500/20 border-gray-500/50',
    badgeClass: 'bg-gray-500/30 text-gray-300 border-gray-500/60',
    accentClass: 'border-l-gray-500',
    dotClass: 'bg-gray-500',
  },
};

const PENDING_STYLE: GuessResultStyle = {
  label: 'Checking\u2026',
  barClass: 'bg-fg/30',
  cardClass: 'bg-fg/5 border-fg/10',
  badgeClass: 'bg-fg/10 text-fg/40 border-fg/20',
  accentClass: 'border-l-white/30',
  dotClass: 'bg-fg/30',
};

export function getGuessResultStyle(
  result: GuessHistoryDtoResultEnum | null | undefined,
) {
  if (result == null) return PENDING_STYLE;
  return GUESS_RESULT_STYLE[result] ?? PENDING_STYLE;
}
