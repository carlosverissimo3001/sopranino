import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth/services/auth.service';
import { EmailService } from '../../email/services/email.service';
import { INBOUND_FORWARD_TO } from '../../inbound/consts';
import { AppLoggerService } from '../../logger/logger.service';
import { RedisService } from '../../redis/redis.service';
import {
  FEEDBACK_NOTIFY_DAILY_KEY,
  FEEDBACK_NOTIFY_DAILY_LIMIT,
  FEEDBACK_NOTIFY_TTL_SECONDS,
} from '../consts';
import { reportReceivedEmail } from '../emails/report-received.email';
import { paginate } from '../../utils/pagination/paginate';
import { CreateFeedbackControllerDto } from '../dto/create-feedback-controller.dto';
import { FeedbackDto } from '../dto/feedback.dto';
import { FeedbackPageDto } from '../dto/feedback-page.dto';
import { GetFeedbackDto } from '../dto/get-feedback.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class FeedbackService {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(FeedbackService.name);
  }

  async submit({
    body,
    sessionId,
    userAgent,
  }: {
    body: CreateFeedbackControllerDto;
    sessionId?: string;
    userAgent?: string;
  }): Promise<void> {
    // A filled honeypot is a bot. Answering as if it worked teaches it nothing.
    if (body.website) {
      return;
    }

    const user = await this.userFor(sessionId);
    const report = {
      kind: body.kind,
      message: body.message,
      email: body.email,
      pagePath: body.pagePath,
      userAgent: userAgent?.slice(0, 512),
    };
    await this.feedbackRepository.create({ ...report, userId: user?.id });

    // After the row is safe, and never awaited: mail must not fail a report.
    void this.notify({ ...report, senderName: user?.displayName });
  }

  private async notify(
    report: Omit<Parameters<typeof reportReceivedEmail>[0], 'to' | 'adminUrl'>,
  ): Promise<void> {
    const to = this.config.get<string>(INBOUND_FORWARD_TO);
    if (!to) {
      return;
    }
    try {
      if (!(await this.claimNotification())) {
        this.logger.warn('Daily report notification limit reached');
        return;
      }
      const frontendUrl =
        this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      await this.emailService.send(
        reportReceivedEmail({
          ...report,
          to,
          adminUrl: `${frontendUrl}/admin/reports`,
        }),
      );
    } catch (err) {
      this.logger.warn(`Report notification failed: ${(err as Error).message}`);
    }
  }

  private async claimNotification(): Promise<boolean> {
    const client = this.redis.getClient();
    const today = await client.incr(FEEDBACK_NOTIFY_DAILY_KEY);
    if (today === 1) {
      await client.expire(
        FEEDBACK_NOTIFY_DAILY_KEY,
        FEEDBACK_NOTIFY_TTL_SECONDS,
      );
    }
    return today <= FEEDBACK_NOTIFY_DAILY_LIMIT;
  }

  async list(dto: GetFeedbackDto): Promise<FeedbackPageDto> {
    const { items, total } = await this.feedbackRepository.findPage(dto);
    return paginate(items.map(FeedbackDto.fromEntity), total, dto);
  }

  async setResolved(id: string, resolved: boolean): Promise<FeedbackDto> {
    return FeedbackDto.fromEntity(
      await this.feedbackRepository.setResolved(id, resolved),
    );
  }

  /** An expired session still lets the report through, just unattributed. */
  private async userFor(
    sessionId?: string,
  ): Promise<{ id: string; displayName: string } | undefined> {
    if (!sessionId) {
      return undefined;
    }
    try {
      return await this.authService.getUserBySessionId(sessionId);
    } catch {
      return undefined;
    }
  }
}
