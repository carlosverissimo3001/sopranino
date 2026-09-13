/** Signs every webhook Resend sends; from the webhook's page in the dashboard. */
export const RESEND_WEBHOOK_SECRET = 'RESEND_WEBHOOK_SECRET';
/** Comma-separated addresses whose mail is forwarded; the rest is ignored. */
export const INBOUND_ADDRESSES = 'INBOUND_ADDRESSES';
/** The inbox forwarded mail goes to. */
export const INBOUND_FORWARD_TO = 'INBOUND_FORWARD_TO';

export const RESEND_CLIENT = Symbol('RESEND_CLIENT');

/**
 * Forwards draw on the same daily Resend allowance as sign-in mail, and anyone
 * can write to the inbound domain. Past this, mail stays readable in Resend's
 * dashboard rather than spending what a password reset needs.
 */
export const INBOUND_FORWARD_DAILY_LIMIT = 20;
export const INBOUND_FORWARD_DAILY_KEY = 'inbound:forwarded:day';
export const INBOUND_FORWARD_SEEN_PREFIX = 'inbound:forwarded:';
export const INBOUND_FORWARD_TTL_SECONDS = 24 * 60 * 60;
