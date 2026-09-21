'use client';

import { useUpdateRoomSettings } from '@/hooks/multiplayer/useUpdateRoomSettings';
import type { RoomDto, UpdateRoomSettingsControllerDto } from '@/sdk';

type Settings = Required<
  Pick<
    UpdateRoomSettingsControllerDto,
    'roundCount' | 'maxPlayers' | 'findable' | 'chatEnabled'
  >
>;

export interface SettingOption<V> {
  value: V;
  label: string;
  /** Said on hover and to screen readers; the row itself stays one line. */
  hint?: string;
  /** Why it cannot be picked right now, when it cannot. */
  unavailable?: string;
}

interface SettingPickerProps<K extends keyof Settings> {
  room: RoomDto;
  label: string;
  setting: K;
  current: Settings[K];
  options: readonly SettingOption<Settings[K]>[];
}

/**
 * One setting as one row: its name, and a segmented choice. Host only, as
 * the whole panel is; everyone else reads the summary line.
 */
export function SettingPicker<K extends keyof Settings>({
  room,
  label,
  setting,
  current,
  options,
}: SettingPickerProps<K>) {
  const updateSettings = useUpdateRoomSettings();

  // The value being written counts as selected before the server agrees, or
  // the old one stays lit and the spinner lands on the wrong option.
  const inFlight = updateSettings.isPending
    ? (updateSettings.variables.settings[setting] as Settings[K] | undefined)
    : undefined;
  const selected = inFlight ?? current;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg/40">
          {label}
        </p>

        <div
          role="radiogroup"
          aria-label={label}
          className="inline-flex shrink-0 gap-0.5 rounded-full bg-fg/5 p-1"
        >
          {options.map((option) => {
            const active = selected === option.value;
            const disabled = !!option.unavailable;

            return (
              <button
                key={String(option.value)}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                title={option.unavailable ?? option.hint}
                onClick={() => {
                  // Ignored rather than disabled, or every option dims for the
                  // length of the request.
                  if (active || updateSettings.isPending) return;
                  updateSettings.mutate({
                    roomId: room.id,
                    settings: { [setting]: option.value },
                  });
                }}
                className={`h-7 min-w-10 rounded-full px-3 text-xs font-bold tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? 'bg-green-500/15 text-green-400'
                    : 'text-fg/40 hover:text-fg/70'
                }`}
              >
                {option.label}
                {option.hint && (
                  <span className="sr-only">, {option.hint}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {updateSettings.isError && (
        <p className="text-xs text-red-400">{updateSettings.error.message}</p>
      )}
    </div>
  );
}
