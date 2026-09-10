import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SESSION_COOKIE_NAME } from '../../consts';

/**
 * The session if there is one, undefined otherwise. For routes that anyone may
 * read but that show a signed in player something extra - their own row on a
 * public board, say. Use SessionId where a session is required.
 */
export const OptionalSessionId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      cookies?: Record<string, string | undefined>;
    }>();
    return request.cookies?.[SESSION_COOKIE_NAME];
  },
);
