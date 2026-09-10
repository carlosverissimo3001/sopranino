import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';
import { toBoolean } from '@/utils/transformers/toBoolean.transform';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt } from 'class-validator';

export class CreateRoomControllerDto {
  @ApiProperty({
    description: 'Number of rounds for the game',
    enum: [3, 5, 10],
  })
  @IsInt()
  @IsIn([3, 5, 10])
  roundCount: number;

  @ApiPropertyOptional({
    description:
      'Whether the room is listed for anyone to find. Off makes it reachable only by its invite code.',
    default: true,
  })
  @IsNotNullableOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  findable?: boolean;
}
