import { FameTier, TrackGroupDtoTypeEnum } from '@/sdk';

const STORAGE_KEY = 'unpaused:fame-tier';

export const FAME_TIERS: { value: FameTier; label: string; accent: string }[] =
  [
    {
      value: FameTier.Easy,
      label: 'Easy',
      accent: 'bg-emerald-500/15 text-emerald-300',
    },
    {
      value: FameTier.Medium,
      label: 'Medium',
      accent: 'bg-blue-500/15 text-blue-300',
    },
    {
      value: FameTier.Hard,
      label: 'Hard',
      accent: 'bg-orange-500/15 text-orange-300',
    },
    {
      value: FameTier.Expert,
      label: 'Expert',
      accent: 'bg-red-500/15 text-red-300',
    },
    {
      value: FameTier.Impossible,
      label: 'Impossible',
      accent: 'bg-purple-500/15 text-purple-300',
    },
  ];

/** Charts and special sets are all hits or all one fame, so a tier means nothing there. */
export function groupHasFameTiers(type: TrackGroupDtoTypeEnum): boolean {
  return (
    type === TrackGroupDtoTypeEnum.Decade ||
    type === TrackGroupDtoTypeEnum.Genre
  );
}

export function readFameTier(): FameTier {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return FAME_TIERS.some((t) => t.value === stored)
      ? (stored as FameTier)
      : FameTier.Easy;
  } catch {
    return FameTier.Easy;
  }
}

export function saveFameTier(tier: FameTier): void {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // The choice still holds for this visit.
  }
}
