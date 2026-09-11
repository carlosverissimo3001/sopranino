import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotNullableOptional } from '../../utils/decorators/notNullableOptional.decorator';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, IsDate } from 'class-validator';
import { GameMode, GameStatus } from '@prisma/client';
import { TransformToArray } from '../../utils/transformers/toArray.transform';
import { PaginationQueryDto } from '../../utils/pagination/pagination-query.dto';

export class GetHistoryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'The game mode to filter history by (e.g. daily, all)',
    enum: GameMode,
  })
  @IsNotNullableOptional()
  @IsEnum(GameMode)
  mode?: GameMode;

  @ApiPropertyOptional({
    description: 'Search by track name, artist name, or album name',
    type: String,
  })
  @IsNotNullableOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by game status',
    enum: GameStatus,
    isArray: true,
  })
  @IsNotNullableOptional()
  @TransformToArray()
  @IsEnum(GameStatus, { each: true })
  status?: GameStatus[];

  @ApiPropertyOptional({
    description: 'Filter from date (ISO 8601)',
    type: Date,
  })
  @IsNotNullableOptional()
  @IsDate()
  // Not sure if this is necessary, better safe than sorry to ensure we get a Date object
  @Transform(({ value }) => new Date(value))
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter to date (ISO 8601)',
    type: Date,
  })
  @IsNotNullableOptional()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  to?: Date;
}
