'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
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
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            Say something.
          </p>
        ) : (
          messages.map((message) =>
            message.system ? (
              <p
                key={message.id}
                className="px-2 py-1 text-center text-[12px] italic text-fg/40"
              >
                {message.text}
              </p>
            ) : (
              <p
                key={message.id}
                className="group flex items-baseline gap-2 rounded-md px-2 py-0.5 text-[13px] leading-snug transition-colors hover:bg-fg/5"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      message.userId === currentUserId
                        ? 'font-semibold text-spotify-green'
                        : 'font-semibold text-fg/70'
                    }
                  >
                    {message.displayName.split(' ')[0]}
                  </span>{' '}
                  {message.removed ? (
                    <span className="italic text-fg/35">message removed</span>
                  ) : (
                    <span className="text-fg/90">{message.text}</span>
                  )}
                </span>
                <time
                  dateTime={message.sentAt}
                  title={new Date(message.sentAt).toLocaleString()}
                  className="shrink-0 text-[11px] tabular-nums text-fg/25 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  {sentAtLabel(message.sentAt)}
                </time>
              </p>
            ),
          )
        )}
        <div ref={endRef} />
      </div>

      {notice && <p className="pt-2 text-[12px] text-amber-500">{notice}</p>}

      <form
        className="mt-2 flex items-center gap-2"
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
          className="min-w-0 flex-1 rounded-lg border border-fg/10 bg-fg/5 px-3 py-2 text-[14px] text-fg placeholder:text-muted-foreground focus:border-spotify-green/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={cannotSend || !draft.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fg/10 text-fg/70 transition-colors hover:bg-fg/15 hover:text-fg disabled:opacity-40"
        >
          <SendHorizonal className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
