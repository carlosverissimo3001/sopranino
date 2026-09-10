import { IsNotNullableOptional } from '@/utils/decorators/notNullableOptional.decorator';
import { toBoolean } from '@/utils/transformers/toBoolean.transform';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsString, Length } from 'class-validator';
import { ROOM_NAME_MAX_LENGTH } from '../../consts';

export class UpdateRoomSettingsControllerDto {
  @ApiPropertyOptional({
    description: 'What the room is called, in the lobby and to its players',
    maxLength: ROOM_NAME_MAX_LENGTH,
  })
  @IsNotNullableOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, ROOM_NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({
    description:
      'Whether the room is listed for anyone to find. Off makes it reachable only by its invite code.',
  })
  @IsNotNullableOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  findable?: boolean;

  @ApiPropertyOptional({
    description: 'Number of rounds for the game',
    enum: [3, 5, 10],
  })
  @IsNotNullableOptional()
  @IsInt()
  @IsIn([3, 5, 10])
  roundCount?: number;
}
