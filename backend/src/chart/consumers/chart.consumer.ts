import { OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  CHART_REFRESH_QUEUE,
  REFRESH_CHARTS_JOB,
  JobNames,
} from '../../consts';
import { CHART_REFRESH_CRON, CHART_REFRESH_TZ } from '../chart.constants';
import { ChartService } from '../services/chart.service';
import { AppLoggerService } from '../../logger/logger.service';

@Processor(CHART_REFRESH_QUEUE)
export class ChartConsumer extends WorkerHost implements OnModuleInit {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectQueue(CHART_REFRESH_QUEUE) private readonly queue: Queue,
    private readonly chartService: ChartService,
    appLogger: AppLoggerService,
  ) {
    super();
    this.logger = appLogger.child(ChartConsumer.name);
  }

  async onModuleInit() {
    await this.queue.add(
      REFRESH_CHARTS_JOB,
      {},
      {
        repeat: { pattern: CHART_REFRESH_CRON, tz: CHART_REFRESH_TZ },
        jobId: REFRESH_CHARTS_JOB,
      },
    );

    if (await this.chartService.needsSeeding()) {
      this.logger.log('Charts are empty; refreshing now');
      void this.chartService
        .refreshAll()
        .catch((error: Error) =>
          this.logger.error(`Seed refresh failed: ${error.message}`),
        );
    }
  }

  async process(job: Job<Record<string, never>, void, string>): Promise<void> {
    const jobName = job.name as JobNames;

    switch (jobName) {
      case REFRESH_CHARTS_JOB:
        await this.chartService.refreshAll();
        break;

      default:
        this.logger.warn(`Unknown job name: ${jobName}`);
    }
  }
}
