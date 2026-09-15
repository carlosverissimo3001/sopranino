import { Disc3, Library, ListMusic, type LucideIcon } from 'lucide-react';
import { RoomDtoTrackSourceEnum } from '@/sdk';

/** How a room's song source reads wherever the room is summed up. */
export function trackSourceSummary(
  source: string,
  {
    setName,
    libraries = 'Our libraries',
  }: { setName?: string; libraries?: string } = {},
): { label: string; Icon: LucideIcon } {
  switch (source) {
    case RoomDtoTrackSourceEnum.Set:
      return { label: setName ?? 'A set', Icon: ListMusic };
    case RoomDtoTrackSourceEnum.Libraries:
      return { label: libraries, Icon: Library };
    default:
      return { label: 'Anything', Icon: Disc3 };
  }
}
