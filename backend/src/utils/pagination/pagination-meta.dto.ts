import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items across all pages' })
  totalItems: number;

  @ApiProperty({ description: 'Number of items on the current page' })
  itemCount: number;

  @ApiProperty({ description: 'Number of items per page' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Current page number (1-indexed)' })
  currentPage: number;
}
