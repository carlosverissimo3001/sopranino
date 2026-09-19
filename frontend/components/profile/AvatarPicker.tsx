'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMe } from '@/hooks/auth/useMe';
import { useUploadAvatar } from '@/hooks/user-avatar/useUploadAvatar';
import { useUpdateAvatarSource } from '@/hooks/user-avatar/useUpdateAvatarSource';
import { AuthMeResponseDtoAvatarSourceEnum as AvatarSource } from '../../sdk';

const ITEM =
  'cursor-pointer gap-2.5 text-xs text-fg/70 focus:bg-fg/[0.08] focus:text-fg';

/** The avatar is its own control: tap it to pick a photo or upload one. */
export function AvatarPicker({
  onError,
}: {
  onError: (message: string | null) => void;
}) {
  const { data: user } = useMe();
  const { mutate: uploadAvatar, isPending: isUploading } = useUploadAvatar();
  const { mutate: updateSource, isPending: isSwitching } =
    useUpdateAvatarSource();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const source = user.avatarSource ?? AvatarSource.Spotify;
  const busy = isUploading || isSwitching;
  const choices = [
    user.spotifyAvatarUrl && {
      source: AvatarSource.Spotify,
      label: 'Spotify photo',
      url: user.spotifyAvatarUrl,
    },
    user.customAvatarUrl && {
      source: AvatarSource.Custom,
      label: 'Your photo',
      url: user.customAvatarUrl,
    },
  ].filter((choice) => !!choice);

  function upload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onError(null);
    uploadAvatar(file, { onError: (err) => onError(err.message) });
    e.target.value = '';
  }

  const face = (
    <>
      <span className="relative block h-full w-full overflow-hidden rounded-2xl border border-fg/10 bg-fg/5">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt=""
            fill
            className="object-cover"
            sizes="72px"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-black text-fg/60">
            {user.displayName[0]?.toUpperCase()}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-bg/70">
            <Loader2 className="h-5 w-5 animate-spin text-spotify-green" />
          </span>
        )}
      </span>
      <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-bg bg-spotify-green text-black transition-transform group-hover:scale-110">
        <Camera className="h-3.5 w-3.5" />
      </span>
    </>
  );

  const trigger =
    'group relative block h-[72px] w-[72px] shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-spotify-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none';

  return (
    <div className="shrink-0">
      {/* With nothing to switch between, a menu of one item is a wasted tap. */}
      {choices.length === 0 ? (
        <button
          type="button"
          onClick={upload}
          disabled={busy}
          aria-label="Upload a photo"
          className={trigger}
        >
          {face}
        </button>
      ) : (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            disabled={busy}
            aria-label="Change your photo"
            className={trigger}
          >
            {face}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[190px] border border-fg/10 bg-surface/80 backdrop-blur-md"
          >
            {choices.map((choice) => (
              <DropdownMenuItem
                key={choice.source}
                onSelect={() => {
                  if (choice.source !== source) updateSource(choice.source);
                }}
                className={ITEM}
              >
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={choice.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </span>
                <span className="flex-1">{choice.label}</span>
                {choice.source === source && (
                  <Check className="h-3.5 w-3.5 text-spotify-green" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onSelect={upload} className={ITEM}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-fg/5">
                <Camera className="h-3.5 w-3.5" />
              </span>
              {user.customAvatarUrl ? 'Upload a new photo' : 'Upload a photo'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
