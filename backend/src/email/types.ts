export interface EmailMessage {
  to: string;
  subject: string;
  /** Both are sent. A client that refuses HTML still gets the link. */
  html: string;
  text: string;
  /** Overrides the configured reply-to, for mail a reply should go elsewhere. */
  replyTo?: string;
}

export interface EmailSender {
  from: string;
  /**
   * Where a reply goes. Worth setting even though almost nobody replies: a
   * sender that cannot be answered reads as one way, and someone with no
   * other way to respond reaches for "report spam" instead.
   */
  replyTo?: string;
}

/**
 * Somewhere to hand a message to. Two of these exist: one that talks to
 * Resend, and one that writes to the log for every environment that cannot.
 */
export interface EmailTransport {
  readonly name: string;
  send(message: EmailMessage, sender: EmailSender): Promise<void>;
}
