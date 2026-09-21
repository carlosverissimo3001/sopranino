'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { useUpdateRoomSettings } from '@/hooks/multiplayer/useUpdateRoomSettings';
import type { ChatMessage, Refusal } from '@/lib/chat-socket';
import type { RoomPlayerDto } from '@/sdk';

type ChatDockProps = {
  messages: ChatMessage[];
  currentUserId?: string;
  onSend: (text: string) => void;
  refused?: Refusal;
  muted?: boolean;
  label?: string;
  /** Which screen this is, so each remembers its own open state. */
  scope: 'room' | 'round' | 'results';
  /** The room id. What has been read is remembered against it. */
  channel: string;
  /** Open on arrival, on a wide screen only: on a phone it would cover the page. */
  defaultOpen?: boolean;
  /** The room's roster, so a message shows its sender's name as it is now. */
  players?: RoomPlayerDto[];
  /** False once the host has closed the room's chat. */
  chatEnabled?: boolean;
  /** Only the host gets the switch, and only the host sees a closed dock. */
  isHost?: boolean;
};

const WIDE_SCREEN = '(min-width: 640px)';

const storageKey = (scope: string) => `unpaused:chat-open:${scope}`;
const readKey = (channel: string) => `unpaused:chat-read:${channel}`;

function read(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private window, or storage is blocked */
  }
}

function storedOpen(scope: string): boolean | undefined {
  const stored = read(storageKey(scope));
  return stored === undefined ? undefined : stored === 'true';
}

export function ChatDock(props: ChatDockProps) {
  const {
    messages,
    currentUserId,
    onSend,
    refused,
    muted,
    label = 'Chat',
    scope,
    channel,
    defaultOpen = false,
    players,
    chatEnabled = true,
    isHost = false,
  } = props;
  const updateSettings = useUpdateRoomSettings();
  const setChat = (enabled: boolean) =>
    updateSettings.mutate({
      roomId: channel,
      settings: { chatEnabled: enabled },
    });
  // A message carries the name it was sent under; somebody who has renamed
  // since shows by their current one.
  const named = useMemo(() => {
    if (!players?.length) return messages;
    const nameOf = new Map(players.map((p) => [p.userId, p.displayName]));
    return messages.map((message) => {
      const current = nameOf.get(message.userId);
      return current && current !== message.displayName
        ? { ...message, displayName: current }
        : message;
    });
  }, [messages, players]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const seenRef = useRef(0);
  /** Cleared once the arriving history has been measured against it. */
  const lastReadRef = useRef<string | undefined>(undefined);

  // After mount rather than in the initial state: the server renders this too,
  // and reading storage there would hydrate against a different value. Before
  // paint, or a dock closed last time flashes open for a frame on every visit.
  useLayoutEffect(() => {
    setOpen(
      storedOpen(scope) ?? (defaultOpen && matchMedia(WIDE_SCREEN).matches),
    );
    lastReadRef.current = read(readKey(channel));
  }, [scope, channel, defaultOpen]);

  const markRead = (upTo: ChatMessage[]) => {
    const last = upTo[upTo.length - 1];
    if (last) write(readKey(channel), last.id);
  };

  const toggle = (next: boolean) => {
    setOpen(next);
    write(storageKey(scope), String(next));
    if (next) markRead(messages);
  };

  useEffect(() => {
    if (open) {
      seenRef.current = messages.length;
      markRead(messages);
      setUnread(0);
      return;
    }

    // The history that arrives on joining was read already if it was read on
    // the screen before this one: the last id read stands for the backlog up
    // to it. Arriving in a room for the first time, all of it is unread, and
    // so is everything after a last-read id too old to still be in the buffer.
    if (seenRef.current === 0 && messages.length > 0) {
      const lastRead = lastReadRef.current;
      seenRef.current = lastRead
        ? messages.findIndex((message) => message.id === lastRead) + 1
        : 0;
    }

    const fresh = messages
      .slice(seenRef.current)
      .filter((message) => message.userId !== currentUserId);
    if (fresh.length > 0) {
      setUnread((previous) => previous + fresh.length);
    }
    seenRef.current = messages.length;
    // markRead is recreated per render and only writes; it is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, open, currentUserId]);

  return (
    // In the header strip on a phone: the bottom corner is where a round's
    // guess box, the lobby's Start and the results' last row all end up.
    <div className="fixed right-2 top-1.5 z-40 flex flex-col items-end gap-2 sm:bottom-4 sm:right-4 sm:top-auto sm:pb-[env(safe-area-inset-bottom)]">
      {open && (
        // A backdrop to tap away, on a phone, where the sheet covers the page.
        <div
          aria-hidden
          onClick={() => toggle(false)}
          className="fixed inset-0 bg-black/40 sm:hidden"
        />
      )}
      {open && (
        // A sheet across the bottom on a phone, a card in the corner from sm.
        <div className="fixed inset-x-0 bottom-0 flex h-[min(28rem,70dvh)] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-fg/10 bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] sm:static sm:h-[22rem] sm:w-[min(20rem,calc(100vw-2rem))] sm:rounded-2xl sm:border-b sm:pb-0 sm:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {/* The whole bar collapses, as it did when it was one button; the ×
              is the labelled control for keyboards and readers. */}
          <div
            onClick={() => toggle(false)}
            className="flex cursor-pointer items-center gap-2 border-b border-fg/10 px-3 py-1.5 transition-colors hover:bg-fg/5"
          >
            <span className="flex-1 text-xs font-bold uppercase tracking-widest text-fg/40">
              {label}
            </span>
            {isHost && chatEnabled && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setChat(false);
                }}
                disabled={updateSettings.isPending}
                className="cursor-pointer rounded-md px-2 py-1 text-[11px] font-semibold text-fg/50 transition-colors hover:bg-fg/5 hover:text-fg disabled:opacity-50"
              >
                Turn off for everyone
              </button>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggle(false);
              }}
              aria-expanded
              aria-label={`Collapse ${label.toLowerCase()} chat`}
              className="cursor-pointer rounded-md p-1 transition-colors hover:bg-fg/5"
            >
              <X className="h-4 w-4 text-fg/50" aria-hidden />
            </button>
          </div>
          {!chatEnabled ? (
            // Only the host reaches this: everyone else has no dock at all.
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-fg/60">
                Chat is off for everyone in this room.
              </p>
              <button
                type="button"
                onClick={() => setChat(true)}
                disabled={updateSettings.isPending}
                className="cursor-pointer rounded-full bg-spotify-green px-4 py-2 text-xs font-black text-black transition-opacity disabled:opacity-50"
              >
                Turn it back on
              </button>
            </div>
          ) : (
            <ChatPanel
              messages={named}
              currentUserId={currentUserId}
              onSend={onSend}
              refused={refused}
              muted={muted}
              className="flex-1 p-3"
            />
          )}
        </div>
      )}

      {!open && (
        <button
          onClick={() => toggle(true)}
          aria-label={unread > 0 ? `${label}, ${unread} unread` : label}
          // A plain header icon on a phone, where it sits in the header strip;
          // the floating bubble from sm.
          className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12 sm:border sm:shadow-lg ${
            unread > 0
              ? 'text-spotify-green sm:border-spotify-green/40 sm:bg-spotify-green sm:text-spotify-black'
              : 'text-fg/60 hover:text-fg sm:border-fg/10 sm:bg-surface'
          }`}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-spotify-green px-1 text-[10px] font-bold tabular-nums text-spotify-black sm:-right-1 sm:-top-1 sm:h-5 sm:min-w-5 sm:bg-fg sm:text-[11px] sm:text-bg">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
