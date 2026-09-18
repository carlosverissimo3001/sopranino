import type { Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  text: string;
  sentAt: string;
}

/** Cosmetic only: the gateway refuses a message whatever the browser thinks. */
export const CHAT_ENABLED = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true';

/** Must match CHAT_MAX_LENGTH on the server, which truncates past it. */
export const CHAT_MAX_LENGTH = 300;

/** Must match LOBBY_ROOM on the server. */
export const LOBBY_CHANNEL = 'lobby';

interface ChatHandlers {
  onHistory: (messages: ChatMessage[]) => void;
  onMessage: (message: ChatMessage) => void;
  onRefused: (reason: string) => void;
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
    (data: { channel: string; messages: ChatMessage[] }) => {
      if (data.channel === channel) handlers.onHistory(data.messages);
    },
  );

  socket.on('message', (data: { channel: string; message: ChatMessage }) => {
    if (data.channel === channel) handlers.onMessage(data.message);
  });

  socket.on('messageRefused', ({ reason }: { reason: string }) => {
    handlers.onRefused(reason);
  });
}
