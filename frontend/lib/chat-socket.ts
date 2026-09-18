import type { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  text: string;
  sentAt: string;
  /** Left where a blocked message was, so the room is not silently edited. */
  removed?: boolean;
  /** Said by the room rather than by a player, and shown without a name. */
  system?: boolean;
}

/** Cosmetic only: the gateway refuses a message whatever the browser thinks. */
export const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true';

/** Must match CHAT_MAX_LENGTH on the server, which truncates past it. */
export const CHAT_MAX_LENGTH = 300;

export interface Refusal {
  reason: string;
  /** Two identical refusals in a row are still two events. */
  at: number;
  /** Blocked messages left before chat is lost for this room. */
  strikesLeft?: number;
}

interface ChatHandlers {
  onHistory: (messages: ChatMessage[], muted: boolean) => void;
  onMessage: (message: ChatMessage) => void;
  onRefused: (reason: string, strikesLeft?: number) => void;
}

/**
 * Both sockets carry chat for exactly one channel, so the listeners drop
 * anything addressed elsewhere rather than the caller filtering after the fact.
 */
export function attachChat(
  socket: Socket,
  channel: string,
  handlers: ChatHandlers,
): void {
  socket.on(
    'messageHistory',
    (data: { channel: string; messages: ChatMessage[]; muted?: boolean }) => {
      if (data.channel === channel) {
        handlers.onHistory(data.messages, data.muted ?? false);
      }
    },
  );

  socket.on('message', (data: { channel: string; message: ChatMessage }) => {
    if (data.channel === channel) handlers.onMessage(data.message);
  });

  socket.on(
    'messageRefused',
    ({ reason, strikesLeft }: { reason: string; strikesLeft?: number }) => {
      handlers.onRefused(reason, strikesLeft);
    },
  );
}
