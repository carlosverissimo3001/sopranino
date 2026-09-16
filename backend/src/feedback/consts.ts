export const FEEDBACK_MESSAGE_MIN = 3;
export const FEEDBACK_MESSAGE_MAX = 2000;

/** An artist name, not a report: short enough not to be a second long-form channel. */
export const FEEDBACK_REQUEST_MAX = 80;

/**
 * Notifications share the daily Resend allowance with sign-in mail, and the
 * form is open to guests. Past this, reports are still stored, just not mailed.
 */
export const FEEDBACK_NOTIFY_DAILY_LIMIT = 20;
export const FEEDBACK_NOTIFY_DAILY_KEY = 'feedback:notified:day';
export const FEEDBACK_NOTIFY_TTL_SECONDS = 24 * 60 * 60;
