export const MODERATION_API_URL = 'https://api.typesafe.ai/v1/systemone';
export const MODERATION_MODEL = 'jev-latest';

/**
 * Measured at p50 272ms and p95 675ms over thirty lines. Past this the sender
 * is waiting on a chat message, which is worse than asking them to try again.
 */
export const MODERATION_TIMEOUT_MS = 2000;

/**
 * Above this a message is blocked. The scores are bimodal: nothing measured as
 * banter has scored above 0.26, and an insult aimed at a person starts around
 * 0.45. The bar sits in the gap rather than near either cluster, because the
 * same string moves by about 0.07 between runs.
 *
 * The cost is known: "stop being such an idiot" and "lol bitch" both scored
 * 0.57, so a mild insult between friends is blocked along with the real thing.
 * A room strangers can join is why that trade goes this way.
 */
export const MODERATION_BLOCK_AT = 0.4;
