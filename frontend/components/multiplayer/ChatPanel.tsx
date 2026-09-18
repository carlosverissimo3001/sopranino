'use client';

import { useEffect, useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import { CHAT_MAX_LENGTH, type ChatMessage } from '@/lib/chat-socket';

type ChatPanelProps = {
  messages: ChatMessage[];
  currentUserId?: string;
  onSend: (text: string) => void;
  refused?: string;
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
};

export function ChatPanel(props: ChatPanelProps) {
  const { messages, currentUserId, onSend, refused, className } = props;
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

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
          messages.map((message) => (
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
                <span className="text-fg/90">{message.text}</span>
              </span>
              <time
                dateTime={message.sentAt}
                title={new Date(message.sentAt).toLocaleString()}
                className="shrink-0 text-[11px] tabular-nums text-fg/25 opacity-0 transition-opacity group-hover:opacity-100"
              >
                {sentAtLabel(message.sentAt)}
              </time>
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>

      {refused && (
        <p className="pt-2 text-[12px] text-amber-500">
          {REFUSALS[refused] ?? 'That did not send.'}
        </p>
      )}

      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={CHAT_MAX_LENGTH}
          placeholder="Message"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-lg border border-fg/10 bg-fg/5 px-3 py-2 text-[14px] text-fg placeholder:text-muted-foreground focus:border-spotify-green/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fg/10 text-fg/70 transition-colors hover:bg-fg/15 hover:text-fg disabled:opacity-40"
        >
          <SendHorizonal className="h-4 w-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
