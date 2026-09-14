import { FeedbackKind } from '@prisma/client';

/** What the service hands the repository: the body plus what the server knows. */
export interface CreateFeedbackDto {
  kind: FeedbackKind;
  message: string;
  email?: string;
  userId?: string;
  pagePath?: string;
  appVersion?: string;
  userAgent?: string;
}
