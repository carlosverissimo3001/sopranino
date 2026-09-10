import { OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  EXPIRE_ABANDONED_ROOMS_JOB,
  JobNames,
  ROOM_CLEANUP_CRON,
  ROOM_CLEANUP_QUEUE,
} from '../../consts';
import { RoomService } from '../services/room.service';
import { AppLoggerService } from '../../logger/logger.service';

@Processor(ROOM_CLEANUP_QUEUE)
export class RoomConsumer extends WorkerHost implements OnModuleInit {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectQueue(ROOM_CLEANUP_QUEUE) private readonly queue: Queue,
    private readonly roomService: RoomService,
    appLogger: AppLoggerService,
  ) {
    super();
    this.logger = appLogger.child(RoomConsumer.name);
  }

  async onModuleInit() {
    // The fixed jobId keeps every instance registering the same repeatable.
    await this.queue.add(
      EXPIRE_ABANDONED_ROOMS_JOB,
      {},
      {
        repeat: { pattern: ROOM_CLEANUP_CRON },
        jobId: EXPIRE_ABANDONED_ROOMS_JOB,
      },
    );
  }

  async process(job: Job<Record<string, never>, void, string>): Promise<void> {
    const jobName = job.name as JobNames;

    switch (jobName) {
      case EXPIRE_ABANDONED_ROOMS_JOB: {
        const expired = await this.roomService.expireAbandonedRooms();
        if (expired > 0) {
          this.logger.log(`Expired ${expired} abandoned rooms`);
        }
        break;
      }

      default:
        this.logger.warn(`Unknown job name: ${jobName}`);
    }
  }
}
