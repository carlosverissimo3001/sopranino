import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@prisma/prisma.module';
import { CHART_REFRESH_QUEUE, JOB_OPTIONS_WITH_BACKOFF } from '../consts';
import { ChartService } from './services/chart.service';
import { ChartRepository } from './repositories/chart.repository';
import { ChartConsumer } from './consumers/chart.consumer';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: CHART_REFRESH_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  providers: [ChartService, ChartRepository, ChartConsumer],
})
export class ChartModule {}
