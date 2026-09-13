import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { OptionalSessionId } from '@utils/decorators/optionalSessionId.decorator';
import {
  THROTTLE_FEEDBACK,
  THROTTLE_FEEDBACK_LIMIT,
  THROTTLE_TTL,
} from '../../throttle/throttle.constants';
import { CreateFeedbackControllerDto } from '../dto/create-feedback-controller.dto';
import { FeedbackService } from '../services/feedback.service';

@ApiTags('Api')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(204)
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [THROTTLE_FEEDBACK]: { limit: THROTTLE_FEEDBACK_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiOperation({ summary: 'Report a bug or suggest a feature' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async submit(
    @OptionalSessionId() sessionId: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Body() body: CreateFeedbackControllerDto,
  ): Promise<void> {
    await this.feedbackService.submit({ body, sessionId, userAgent });
  }
}
