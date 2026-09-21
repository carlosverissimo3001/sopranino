'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
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
  defaultOpen?: boolean;
  /** The room's roster, so a message shows its sender's name as it is now. */
  players?: RoomPlayerDto[];
};

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
  } = props;
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
  const [open, setOpen] = useState(defaultOpen);
  const [unread, setUnread] = useState(0);
  const seenRef = useRef(0);
  /** Cleared once the arriving history has been measured against it. */
  const lastReadRef = useRef<string | undefined>(undefined);

  // After mount rather than in the initial state: the server renders this too,
  // and reading storage there would hydrate against a different value.
  useEffect(() => {
    const stored = storedOpen(scope);
    if (stored !== undefined) setOpen(stored);
    lastReadRef.current = read(readKey(channel));
  }, [scope, channel]);

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
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)]">
      {open && (
        <div className="flex h-[22rem] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-fg/10 bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => toggle(false)}
            aria-expanded
            aria-label={`Collapse ${label.toLowerCase()} chat`}
            className="flex items-center justify-between border-b border-fg/10 px-3 py-2.5 text-left transition-colors hover:bg-fg/5"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-fg/40">
              {label}
            </span>
            <X className="h-4 w-4 text-fg/50" aria-hidden />
          </button>
          <ChatPanel
            messages={named}
            currentUserId={currentUserId}
            onSend={onSend}
            refused={refused}
            muted={muted}
            className="flex-1 p-3"
          />
        </div>
      )}

      {!open && (
        <button
          onClick={() => toggle(true)}
          aria-label={unread > 0 ? `${label}, ${unread} unread` : label}
          className={`relative flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors ${
            unread > 0
              ? 'border-spotify-green/40 bg-spotify-green text-spotify-black'
              : 'border-fg/10 bg-surface text-fg/70 hover:text-fg'
          }`}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fg px-1 text-[11px] font-bold tabular-nums text-bg">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
