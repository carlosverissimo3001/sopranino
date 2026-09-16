import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  FILL_PLAYLIST_IMPORT_JOB,
  PLAYLIST_IMPORT_QUEUE,
  type JobDataMap,
  type JobNames,
} from '../../consts';
import { AppLoggerService } from '../../logger/logger.service';
import { PlaylistImportService } from '../services/playlist-import.service';

// One at a time is the global ceiling: an import can never take the app down.
@Processor(PLAYLIST_IMPORT_QUEUE, { concurrency: 1 })
export class PlaylistImportConsumer extends WorkerHost {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly playlistImportService: PlaylistImportService,
    appLogger: AppLoggerService,
  ) {
    super();
    this.logger = appLogger.child(PlaylistImportConsumer.name);
  }

  async process(
    job: Job<JobDataMap[typeof FILL_PLAYLIST_IMPORT_JOB], void, string>,
  ): Promise<void> {
    const jobName = job.name as JobNames;

    switch (jobName) {
      case FILL_PLAYLIST_IMPORT_JOB:
        await this.playlistImportService.fill(job.data.trackGroupId);
        break;

      default:
        this.logger.warn(`Unknown job name: ${jobName}`);
    }
  }
}
