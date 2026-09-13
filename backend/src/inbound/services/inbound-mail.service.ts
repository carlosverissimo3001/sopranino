import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Resend, WebhookEventPayload } from 'resend';
import { AppLoggerService } from '../../logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import { EMAIL_FROM } from '../../email/consts';
import {
  INBOUND_ADDRESSES,
  INBOUND_FORWARD_DAILY_KEY,
  INBOUND_FORWARD_DAILY_LIMIT,
  INBOUND_FORWARD_SEEN_PREFIX,
  INBOUND_FORWARD_TO,
  INBOUND_FORWARD_TTL_SECONDS,
  RESEND_CLIENT,
  RESEND_WEBHOOK_SECRET,
} from '../consts';

export interface SignedWebhook {
  payload: string;
  id?: string;
  timestamp?: string;
  signature?: string;
}

export type ForwardOutcome =
  | 'forwarded'
  | 'ignored-event'
  | 'ignored-recipient'
  | 'over-daily-limit';

@Injectable()
export class InboundMailService {
  private readonly logger: AppLoggerService;

  constructor(
    @Inject(RESEND_CLIENT) private readonly resend: Resend | null,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(InboundMailService.name);
  }

  async handle(webhook: SignedWebhook): Promise<ForwardOutcome> {
    const secret = this.config.get<string>(RESEND_WEBHOOK_SECRET);
    const forwardTo = this.config.get<string>(INBOUND_FORWARD_TO);
    if (!this.resend || !secret || !forwardTo) {
      // Unconfigured is not the sender's fault; a 503 has Resend try again.
      throw new ServiceUnavailableException('Inbound mail is not configured');
    }

    const event = this.verify(webhook, secret);
    if (event.type !== 'email.received') {
      return 'ignored-event';
    }

    const allowed = this.allowedAddresses();
    if (!event.data.to.some((to) => allowed.has(addressOf(to)))) {
      return 'ignored-recipient';
    }

    const emailId = event.data.email_id;
    if (!(await this.claimForward(emailId))) {
      this.logger.warn(
        `Daily forward limit reached; ${emailId} left in Resend`,
      );
      return 'over-daily-limit';
    }

    await this.forward({ emailId, forwardTo });
    return 'forwarded';
  }

  private verify(webhook: SignedWebhook, secret: string): WebhookEventPayload {
    if (!webhook.id || !webhook.timestamp || !webhook.signature) {
      throw new BadRequestException('Missing webhook signature');
    }
    try {
      return this.resend!.webhooks.verify({
        payload: webhook.payload,
        headers: {
          id: webhook.id,
          timestamp: webhook.timestamp,
          signature: webhook.signature,
        },
        webhookSecret: secret,
      });
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async forward({
    emailId,
    forwardTo,
  }: {
    emailId: string;
    forwardTo: string;
  }): Promise<void> {
    const client = this.resend!;
    const { data: email, error } = await client.emails.receiving.get(emailId);
    if (error || !email) {
      throw new Error(`Could not read ${emailId}: ${error?.message}`);
    }

    const attachments = email.attachments.length
      ? ((await client.emails.receiving.attachments.list({ emailId })).data
          ?.data ?? [])
      : [];

    const { error: sendError } = await client.emails.send(
      {
        from: this.config.get<string>(EMAIL_FROM)!,
        to: forwardTo,
        // So a reply from the inbox goes to whoever wrote, not back to us.
        replyTo: email.reply_to?.[0] ?? email.from,
        subject: oneLine(email.subject) || '(no subject)',
        ...(email.html ? { html: email.html } : {}),
        text: email.text ?? '',
        attachments: attachments.map((attachment) => ({
          filename: attachment.filename,
          path: attachment.download_url,
          contentType: attachment.content_type,
          contentId: attachment.content_id,
        })),
      },
      // A retried webhook resends the same request, which Resend then ignores.
      { idempotencyKey: `inbound-forward/${emailId}` },
    );
    if (sendError) {
      throw new Error(`Could not forward ${emailId}: ${sendError.message}`);
    }
  }

  /** Counts each email once, however many times its webhook is retried. */
  private async claimForward(emailId: string): Promise<boolean> {
    const client = this.redis.getClient();
    const firstSeen = await client.set(
      `${INBOUND_FORWARD_SEEN_PREFIX}${emailId}`,
      '1',
      'EX',
      INBOUND_FORWARD_TTL_SECONDS,
      'NX',
    );
    if (!firstSeen) {
      return true;
    }

    const today = await client.incr(INBOUND_FORWARD_DAILY_KEY);
    if (today === 1) {
      await client.expire(
        INBOUND_FORWARD_DAILY_KEY,
        INBOUND_FORWARD_TTL_SECONDS,
      );
    }
    return today <= INBOUND_FORWARD_DAILY_LIMIT;
  }

  private allowedAddresses(): Set<string> {
    return new Set(
      (this.config.get<string>(INBOUND_ADDRESSES) ?? '')
        .split(',')
        .map((address) => address.trim().toLowerCase())
        .filter(Boolean),
    );
  }
}

/** "Support <support@x.app>" and "support@x.app" both become the address. */
function addressOf(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

function oneLine(value: string | null | undefined): string {
  return (value ?? '').replace(/[\r\n]+/g, ' ').trim();
}
