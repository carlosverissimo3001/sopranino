import { Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { paginate } from '../../utils/pagination/paginate';
import { CreateFeedbackControllerDto } from '../dto/create-feedback-controller.dto';
import { FeedbackDto } from '../dto/feedback.dto';
import { FeedbackPageDto } from '../dto/feedback-page.dto';
import { GetFeedbackDto } from '../dto/get-feedback.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly authService: AuthService,
  ) {}

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

    await this.feedbackRepository.create({
      kind: body.kind,
      message: body.message,
      email: body.email,
      pagePath: body.pagePath,
      userAgent: userAgent?.slice(0, 512),
      userId: await this.userIdFor(sessionId),
    });
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
  private async userIdFor(sessionId?: string): Promise<string | undefined> {
    if (!sessionId) {
      return undefined;
    }
    try {
      return (await this.authService.getUserBySessionId(sessionId)).id;
    } catch {
      return undefined;
    }
  }
}
