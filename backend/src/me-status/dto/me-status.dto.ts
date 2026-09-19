import { ApiProperty } from '@nestjs/swagger';
import { StreakStatusDto } from '../../streak/dto/streak-status.dto';

export class MeStatusDto {
  @ApiProperty({
    type: StreakStatusDto,
    description: 'Its playedToday means won today: the streak counts wins',
  })
  streak: StreakStatusDto;

  @ApiProperty({
    description: "Whether today's daily was finished, won or lost",
  })
  dailyPlayedToday: boolean;

  @ApiProperty({ example: 42, description: 'Best speed run score, 0 if none' })
  speedRunBest: number;
}
