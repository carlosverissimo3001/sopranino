'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import {
  CHAT_MAX_LENGTH,
  type ChatMessage,
  type Refusal,
} from '@/lib/chat-socket';

type ChatPanelProps = {
  messages: ChatMessage[];
  currentUserId?: string;
  onSend: (text: string) => void;
  refused?: Refusal;
  muted?: boolean;
  className?: string;
};

/** Hours and minutes in the reader's own zone; the date is in the tooltip. */
function sentAtLabel(sentAt: string): string {
  return new Date(sentAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const REFUSALS: Record<string, string> = {
  tooFast: 'Slow down a moment.',
  block: 'That message was blocked.',
  unavailable: 'Could not check that. Try again.',
  muted: 'You cannot send messages in this room.',
  closed: 'The host has turned chat off.',
};

/**
 * A blocked message leaves "message removed" in the panel under the sender's
 * own name, so saying it was blocked repeats what they can see. What they
 * cannot see is how close they are to losing chat.
 */
function refusalText(refused: Refusal): string {
  if (refused.reason !== 'block') {
    return REFUSALS[refused.reason] ?? 'That did not send.';
  }
  if (refused.strikesLeft === 0) {
    return 'You can no longer chat in this room.';
  }
  if (refused.strikesLeft === undefined) {
    return REFUSALS.block;
  }
  const more =
    refused.strikesLeft === 1 ? 'One more' : `${refused.strikesLeft} more`;
  return `${more} and you lose chat in this room.`;
}

// Paired for both themes: a 400 that reads on dark is lost on light.
const NAME_COLOURS = [
  'text-sky-600 dark:text-sky-400',
  'text-violet-600 dark:text-violet-400',
  'text-pink-600 dark:text-pink-400',
  'text-amber-600 dark:text-amber-400',
  'text-teal-600 dark:text-teal-400',
  'text-orange-600 dark:text-orange-400',
  'text-indigo-600 dark:text-indigo-400',
  'text-rose-600 dark:text-rose-400',
];

/** The same colour for a player on every screen and every visit. */
function nameColour(userId: string): string {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return NAME_COLOURS[Math.abs(hash) % NAME_COLOURS.length];
}

/** Within this, a player's next message joins the last rather than renaming them. */
const GROUP_WINDOW_MS = 2 * 60 * 1000;

function continues(message: ChatMessage, previous?: ChatMessage): boolean {
  return (
    !!previous &&
    !previous.system &&
    !message.system &&
    previous.userId === message.userId &&
    Date.parse(message.sentAt) - Date.parse(previous.sentAt) < GROUP_WINDOW_MS
  );
}

/** A count only once it is worth watching. */
const COUNT_FROM = 40;

/** Long enough to read, short enough not to become part of the panel. */
const REFUSAL_MS = 6000;

export function ChatPanel(props: ChatPanelProps) {
  const { messages, currentUserId, onSend, refused, muted, className } = props;
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | undefined>();
  /** Set by a refusal too, so the box locks without waiting for a rejoin. */
  const [locked, setLocked] = useState(false);
  const cannotSend = muted || locked;
  const endRef = useRef<HTMLDivElement>(null);

  // Keyed on when it happened, so two identical refusals show twice.
  useEffect(() => {
    if (!refused) return;
    setNotice(refusalText(refused));
    if (refused.reason === 'muted' || refused.strikesLeft === 0) {
      setLocked(true);
    }
    const timer = setTimeout(() => setNotice(undefined), REFUSAL_MS);
    return () => clearTimeout(timer);
  }, [refused]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className={`flex min-h-0 flex-col ${className ?? ''}`}>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 ? (
          <p className="flex h-full items-center justify-center text-[13px] text-fg/35">
            Nobody has said anything yet
          </p>
        ) : (
          messages.map((message, index) => {
            if (message.system) {
              return (
                <p key={message.id} className="flex justify-center py-1.5">
                  <span className="rounded-full bg-fg/[0.06] px-2.5 py-0.5 text-[11px] text-fg/45">
                    {message.text}
                  </span>
                </p>
              );
            }

            const grouped = continues(message, messages[index - 1]);
            const mine = message.userId === currentUserId;
            return (
              <div
                key={message.id}
                className={`group rounded-lg px-2 transition-colors hover:bg-fg/[0.04] ${
                  grouped ? 'py-0.5' : 'mt-1.5 pb-0.5 pt-1 first:mt-0'
                }`}
              >
                {!grouped && (
                  <p className="flex items-baseline gap-2 text-[12px] leading-tight">
                    <span
                      className={`font-bold ${mine ? 'text-spotify-green' : nameColour(message.userId)}`}
                    >
                      {mine ? 'You' : message.displayName.split(' ')[0]}
                    </span>
                    <time
                      dateTime={message.sentAt}
                      title={new Date(message.sentAt).toLocaleString()}
                      className="text-[10px] tabular-nums text-fg/25"
                    >
                      {sentAtLabel(message.sentAt)}
                    </time>
                  </p>
                )}
                <p className="break-words text-[13.5px] leading-snug">
                  {message.removed ? (
                    <span className="italic text-fg/35">message removed</span>
                  ) : (
                    <span className="text-fg/90">{message.text}</span>
                  )}
                </p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {notice && <p className="pt-2 text-[12px] text-amber-500">{notice}</p>}

      <form
        className="mt-2 flex items-center gap-1 rounded-full border border-fg/10 bg-fg/[0.05] py-1 pl-4 pr-1 transition-colors focus-within:border-spotify-green/40 focus-within:bg-fg/[0.07]"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setNotice(undefined);
          }}
          maxLength={CHAT_MAX_LENGTH}
          disabled={cannotSend}
          placeholder={cannotSend ? 'You cannot chat here' : 'Message'}
          aria-label="Message"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] text-fg placeholder:text-fg/35 focus:outline-none disabled:opacity-50"
        />
        {CHAT_MAX_LENGTH - draft.length <= COUNT_FROM && (
          <span
            aria-live="polite"
            className="shrink-0 text-[11px] tabular-nums text-fg/40"
          >
            {CHAT_MAX_LENGTH - draft.length}
          </span>
        )}
        <button
          type="submit"
          disabled={cannotSend || !draft.trim()}
          aria-label="Send"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spotify-green text-spotify-black transition-[background-color,color,opacity] hover:bg-spotify-green/90 disabled:bg-fg/10 disabled:text-fg/40"
        >
          <ArrowUp className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </button>
      </form>
    </div>
  );
}
