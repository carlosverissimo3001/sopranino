import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { StreakModule } from '../streak/streak.module';
import { AdminGuard } from '../utils/guards/admin-guard';
import { AdminController } from './controllers/admin.controller';
import { AdminUserService } from './services/admin-user.service';

@Module({
  imports: [AuthModule, StreakModule, FeedbackModule],
  controllers: [AdminController],
  providers: [AdminGuard, AdminUserService],
})
export class AdminModule {}
