import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';

/**
 * A class rather than a generic, because Swagger cannot see a type parameter.
 * The generated SDK gets a real named model instead of untyped items.
 */
export function Paginated<T>(item: Type<T>) {
  class PaginatedDto {
    @ApiProperty({ type: item, isArray: true })
    items: T[];

    @ApiProperty({ type: PaginationMetaDto })
    meta: PaginationMetaDto;
  }

  Object.defineProperty(PaginatedDto, 'name', {
    value: `Paginated${item.name}`,
  });

  return PaginatedDto;
}
