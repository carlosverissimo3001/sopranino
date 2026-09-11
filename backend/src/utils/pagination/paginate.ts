import type { PaginationQueryDto } from './pagination-query.dto';
import type { PaginationMetaDto } from './pagination-meta.dto';

type PageParams = Pick<PaginationQueryDto, 'page' | 'limit'>;

export function skipTake({ page, limit }: PageParams) {
  return { skip: (page - 1) * limit, take: limit };
}

export function paginate<T>(
  items: T[],
  totalItems: number,
  { page, limit }: PageParams,
): { items: T[]; meta: PaginationMetaDto } {
  return {
    items,
    meta: {
      totalItems,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
    },
  };
}
