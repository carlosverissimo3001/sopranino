import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../logger/logger.service';
import {
  MODERATION_API_URL,
  MODERATION_BLOCK_AT,
  MODERATION_MODEL,
  MODERATION_TIMEOUT_MS,
} from '../consts';

export type Verdict = 'allow' | 'block' | 'unavailable';

export interface Judgment {
  verdict: Verdict;
  /** The question that scored highest, for the log rather than the sender. */
  worst?: string;
  score?: number;
}

/**
 * Jev answers each question with the probability that it is true. Five rather
 * than four: a threat scored 0.38 as abuse in the spike and would have gone
 * through, so "i will find you" needs asking about on its own.
 */
const QUESTIONS = {
  harassment: {
    type: 'noul',
    instructions:
      'Is this message abusive towards a person: an insult meant to wound, or telling somebody to harm themselves? Friendly trash talk about how badly somebody is playing is not abuse.',
    criteria: {
      true: 'Aimed at a person and meant to hurt or exclude them.',
      false:
        'Banter, competitive teasing, or frustration aimed at the game, a song or nobody.',
    },
  },
  threat: {
    type: 'noul',
    instructions:
      'Does this message threaten somebody with harm, or try to find out where they live or work?',
    criteria: {
      true: 'A threat of violence, or an attempt to locate or identify somebody offline.',
      false:
        'Competitive bravado about the game, such as promising to win the next round.',
    },
  },
  hate: {
    type: 'noul',
    instructions:
      'Does this message attack or demean somebody for who they are: their race, nationality, religion, gender or sexuality, including a slur used as an insult?',
    criteria: {
      true: 'A slur, or an insult that names what somebody is. Laughter around it changes nothing: "lol" or "haha" beside a slur is the same slur.',
      false:
        'An insult about how somebody is playing, or swearing aimed at the game, a song or nobody in particular.',
    },
  },
  sexual: {
    type: 'noul',
    instructions:
      'Is this message sexually explicit, or an unwanted sexual advance towards somebody in the room?',
  },
  spam: {
    type: 'noul',
    instructions:
      'Is this message spam: an advertisement, a link to somewhere unrelated, a scam, or the same text repeated to flood the room?',
  },
} as const;

/**
 * Without it, banter scores as abuse: the model has no way to know that
 * "you are terrible at this" is what friends say to each other here.
 */
const CONTEXT =
  'A chat message in a multiplayer round of a music guessing game. The players are usually friends, and teasing each other about wrong guesses is normal and welcome.';

@Injectable()
export class ModerationService {
  private readonly logger: AppLoggerService;
  private readonly apiKey?: string;

  constructor(
    private readonly config: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(ModerationService.name);
    this.apiKey = this.config.get<string>('TYPESAFE_API_KEY') || undefined;
  }

  /**
   * Fails closed. A message nobody has read is worse in a public room than a
   * message that did not send, and the sender is told which happened.
   */
  async judge(text: string): Promise<Judgment> {
    if (!this.apiKey) {
      this.logger.warn('No TYPESAFE_API_KEY, so every message is refused');
      return { verdict: 'unavailable' };
    }

    let answers: Record<string, { noul: number }>;
    try {
      const response = await fetch(MODERATION_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODERATION_MODEL,
          state: { context: CONTEXT, message: text },
          questions: QUESTIONS,
        }),
        signal: AbortSignal.timeout(MODERATION_TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(`Moderation refused the call (${response.status})`);
        return { verdict: 'unavailable' };
      }

      ({ answers } = (await response.json()) as {
        answers: Record<string, { noul: number }>;
      });
    } catch (error) {
      this.logger.warn(`Moderation errored: ${(error as Error).message}`);
      return { verdict: 'unavailable' };
    }

    const scored = Object.entries(answers ?? {})
      .map(([name, answer]) => [name, answer?.noul ?? 0] as const)
      .sort((a, b) => b[1] - a[1]);

    const [worst, score] = scored[0] ?? ['none', 0];

    return {
      verdict: score >= MODERATION_BLOCK_AT ? 'block' : 'allow',
      worst,
      score,
    };
  }
}
