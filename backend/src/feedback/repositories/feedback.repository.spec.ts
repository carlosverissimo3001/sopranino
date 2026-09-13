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
      update: jest.fn(),
    },
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
