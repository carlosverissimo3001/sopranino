import { paginate, skipTake } from './paginate';

describe('skipTake', () => {
  it('starts page one at the first row', () => {
    expect(skipTake({ page: 1, limit: 10 })).toEqual({ skip: 0, take: 10 });
  });

  it('skips every row on the pages before', () => {
    expect(skipTake({ page: 3, limit: 25 })).toEqual({ skip: 50, take: 25 });
  });
});

describe('paginate', () => {
  it('counts a partial last page as a page', () => {
    const { meta } = paginate(['a', 'b'], 22, { page: 3, limit: 10 });

    expect(meta).toEqual({
      totalItems: 22,
      itemCount: 2,
      itemsPerPage: 10,
      totalPages: 3,
      currentPage: 3,
    });
  });

  // Zero pages rather than one, so a pager with nothing to page does not
  // offer a page to go to.
  it('has no pages when there is nothing', () => {
    const { items, meta } = paginate([], 0, { page: 1, limit: 10 });

    expect(items).toEqual([]);
    expect(meta.totalPages).toBe(0);
  });
});
