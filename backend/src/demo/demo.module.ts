import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis.module';
import { ChartModule } from '../chart/chart.module';
import { TrackModule } from '../track/track.module';
import { DemoController } from './controllers/demo.controller';
import { DemoService } from './services/demo.service';

@Module({
  imports: [RedisModule, ChartModule, TrackModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
