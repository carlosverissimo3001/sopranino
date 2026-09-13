import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackRepository } from './repositories/feedback.repository';
import { FeedbackService } from './services/feedback.service';

@Module({
  imports: [AuthModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository],
  exports: [FeedbackService],
})
export class FeedbackModule {}
