import { Test } from '@nestjs/testing';
import { FeedbackKind, Prisma } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { GetFeedbackDto } from '../dto/get-feedback.dto';
import { FeedbackRepository } from './feedback.repository';

describe('FeedbackRepository', () => {
  let repository: FeedbackRepository;

  const prisma = {
    feedback: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ total: 0 }]),
  };

  const query = (overrides: Partial<GetFeedbackDto> = {}) =>
    ({ page: 1, limit: 10, ...overrides }) as GetFeedbackDto;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        FeedbackRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = module.get(FeedbackRepository);
  });

  describe('findPage', () => {
    const whereOf = () => prisma.feedback.findMany.mock.calls[0][0].where;

    it('lists everything, newest first, when nothing is filtered', async () => {
      await repository.findPage(query());

      expect(whereOf()).toEqual({});
      expect(prisma.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('filters by kind', async () => {
      await repository.findPage(query({ kind: FeedbackKind.SUGGESTION }));

      expect(whereOf()).toEqual({ kind: FeedbackKind.SUGGESTION });
    });

    it('reads resolved as a resolution date being set', async () => {
      await repository.findPage(query({ resolved: true }));
      expect(whereOf()).toEqual({ resolvedAt: { not: null } });
    });

    it('reads open as no resolution date', async () => {
      await repository.findPage(query({ resolved: false }));
      expect(whereOf()).toEqual({ resolvedAt: null });
    });

    it('counts what the filter matched, not the page', async () => {
      await repository.findPage(query({ kind: FeedbackKind.BUG }));

      expect(prisma.feedback.count).toHaveBeenCalledWith({
        where: { kind: FeedbackKind.BUG },
      });
    });
  });

  describe('findRequestPage', () => {
    const grouped = (
      key: string,
      count: number,
      createdAt = new Date('2026-09-16'),
    ) => ({
      normalizedMessage: key,
      _count: { _all: count, resolvedAt: 0 },
      _max: { createdAt },
    });

    it('counts the keys, and shows the newest spelling of each', async () => {
      prisma.feedback.groupBy.mockResolvedValue([grouped('daft punk', 3)]);
      prisma.$queryRaw.mockResolvedValue([{ total: 1 }]);
      prisma.feedback.findMany.mockResolvedValue([
        { normalizedMessage: 'daft punk', message: 'Daft Punk' },
        { normalizedMessage: 'daft punk', message: 'daft punk!!' },
      ]);

      const { items, total } = await repository.findRequestPage({
        page: 1,
        limit: 10,
      });

      expect(items).toEqual([
        {
          key: 'daft punk',
          name: 'Daft Punk',
          count: 3,
          lastAskedAt: new Date('2026-09-16'),
          resolved: false,
        },
      ]);
      expect(total).toBe(1);
    });

    it('asks the most-wanted first', async () => {
      await repository.findRequestPage({ page: 1, limit: 10 });

      expect(prisma.feedback.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { _count: { id: 'desc' } },
            { _max: { createdAt: 'desc' } },
          ],
        }),
      );
    });

    it('looks at requests alone, and only those it can key', async () => {
      await repository.findRequestPage({ page: 1, limit: 10 });

      expect(prisma.feedback.groupBy.mock.calls[0][0].where).toEqual({
        kind: FeedbackKind.ARTIST_REQUEST,
        normalizedMessage: { not: null },
      });
    });

    it('calls a name resolved only once every ask for it is', async () => {
      prisma.feedback.groupBy.mockResolvedValue([
        { ...grouped('abba', 2), _count: { _all: 2, resolvedAt: 2 } },
        { ...grouped('queen', 2), _count: { _all: 2, resolvedAt: 1 } },
      ]);

      const { items } = await repository.findRequestPage({
        page: 1,
        limit: 10,
      });

      expect(items.map((item) => item.resolved)).toEqual([true, false]);
    });

    it('filters to open asks', async () => {
      await repository.findRequestPage({ page: 1, limit: 10, resolved: false });

      expect(prisma.feedback.groupBy.mock.calls[0][0].where).toEqual({
        kind: FeedbackKind.ARTIST_REQUEST,
        normalizedMessage: { not: null },
        resolvedAt: null,
      });
    });

    // Nothing to fetch spellings for, and the second query would match everything.
    it('does not go looking for spellings when the page is empty', async () => {
      prisma.feedback.groupBy.mockResolvedValue([]);

      const { items } = await repository.findRequestPage({
        page: 1,
        limit: 10,
      });

      expect(items).toEqual([]);
      expect(prisma.feedback.findMany).not.toHaveBeenCalled();
    });
  });

  describe('setRequestResolved', () => {
    beforeEach(() => {
      prisma.feedback.updateMany.mockResolvedValue({ count: 2 });
    });

    it('resolves every open ask under the key, and only those', async () => {
      await repository.setRequestResolved('abba', true);

      expect(prisma.feedback.updateMany).toHaveBeenCalledWith({
        where: {
          kind: FeedbackKind.ARTIST_REQUEST,
          normalizedMessage: 'abba',
          resolvedAt: null,
        },
        data: { resolvedAt: expect.any(Date) },
      });
    });

    it('reopens only the resolved ones', async () => {
      await repository.setRequestResolved('abba', false);

      expect(prisma.feedback.updateMany).toHaveBeenCalledWith({
        where: {
          kind: FeedbackKind.ARTIST_REQUEST,
          normalizedMessage: 'abba',
          resolvedAt: { not: null },
        },
        data: { resolvedAt: null },
      });
    });

    // Resolving twice is not an error, so long as someone asked.
    it('accepts a name that is already resolved', async () => {
      prisma.feedback.updateMany.mockResolvedValue({ count: 0 });
      prisma.feedback.count.mockResolvedValue(2);

      await expect(
        repository.setRequestResolved('abba', true),
      ).resolves.toBeUndefined();
    });

    it('says a key nobody asked for is missing', async () => {
      prisma.feedback.updateMany.mockResolvedValue({ count: 0 });
      prisma.feedback.count.mockResolvedValue(0);

      await expect(
        repository.setRequestResolved('nobody', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('reopens a report by clearing its resolution date', async () => {
    await repository.setResolved('report-1', false);

    expect(prisma.feedback.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { resolvedAt: null } }),
    );
  });

  it('says a missing report is missing', async () => {
    prisma.feedback.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(repository.setResolved('gone', true)).rejects.toThrow(
      NotFoundException,
    );
  });
});
