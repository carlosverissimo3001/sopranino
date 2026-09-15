/**
 * Ten past midnight UTC, so the day it fills is a full day away everywhere and
 * a retry has room before anyone can ask for it.
 */
export const DAILY_TRACK_FILL_CRON = '10 0 * * *';
export const DAILY_TRACK_FILL_TZ = 'UTC';

/** A song cannot come round again inside a month. */
export const DAILY_TRACK_EXCLUSION_DAYS = 30;

/**
 * Pool rows carry no preview, so a pick is only written once its audio has
 * resolved at least once. A track that will not play is set aside and another
 * drawn.
 */
export const DAILY_TRACK_PICK_ATTEMPTS = 5;

/** The one song everyone plays: mostly Easy, Medium on the other days. */
export const DAILY_TRACK_EASY_SHARE = 0.7;
