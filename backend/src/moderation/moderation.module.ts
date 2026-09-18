import { Module } from '@nestjs/common';
import { ModerationService } from './services/moderation.service';

@Module({
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
