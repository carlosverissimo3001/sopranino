import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackKind, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { skipTake } from '../../utils/pagination/paginate';
import { PaginationQueryDto } from '../../utils/pagination/pagination-query.dto';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { GetFeedbackDto } from '../dto/get-feedback.dto';

/** Requests keyed to nothing at all cannot be grouped, so they are left out. */
const GROUPABLE_REQUESTS = {
  kind: FeedbackKind.ARTIST_REQUEST,
  normalizedMessage: { not: null },
} satisfies Prisma.FeedbackWhereInput;

const withUser = { user: { select: { displayName: true } } } as const;

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFeedbackDto): Promise<void> {
    await this.prisma.feedback.create({ data });
  }

  async findPage(dto: GetFeedbackDto) {
    const where: Prisma.FeedbackWhereInput = {
      ...(dto.kind && { kind: dto.kind }),
      ...(dto.resolved !== undefined && {
        resolvedAt: dto.resolved ? { not: null } : null,
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: withUser,
        orderBy: { createdAt: 'desc' },
        ...skipTake(dto),
      }),
      this.prisma.feedback.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * The queue: what was asked for, and by how many. Ordered by count, since a
   * name ten people typed is worth more than the one typed a minute ago.
   */
  async findRequestPage(dto: PaginationQueryDto) {
    const grouped = await this.prisma.feedback.groupBy({
      by: ['normalizedMessage'],
      where: GROUPABLE_REQUESTS,
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: [{ _count: { id: 'desc' } }, { _max: { createdAt: 'desc' } }],
      ...skipTake(dto),
    });

    const [{ total }] = await this.prisma.$queryRaw<[{ total: number }]>`
      SELECT COUNT(DISTINCT normalized_message)::int AS total
      FROM feedback
      WHERE kind = 'ARTIST_REQUEST'::"FeedbackKind"
        AND normalized_message IS NOT NULL
    `;

    if (!grouped.length) {
      return { items: [], total };
    }

    // groupBy keeps the key and forgets the spelling, so the newest raw message
    // for each key is fetched back to show.
    const keys = grouped.map((row) => row.normalizedMessage as string);
    const spellings = await this.prisma.feedback.findMany({
      where: { ...GROUPABLE_REQUESTS, normalizedMessage: { in: keys } },
      orderBy: { createdAt: 'desc' },
      select: { normalizedMessage: true, message: true },
    });

    const newest = new Map<string, string>();
    for (const row of spellings) {
      const key = row.normalizedMessage as string;
      if (!newest.has(key)) {
        newest.set(key, row.message);
      }
    }

    const items = grouped.map((row) => {
      const key = row.normalizedMessage as string;
      return {
        name: newest.get(key) ?? key,
        count: row._count._all,
        lastAskedAt: row._max.createdAt as Date,
      };
    });

    return { items, total };
  }

  async setResolved(id: string, resolved: boolean) {
    try {
      return await this.prisma.feedback.update({
        where: { id },
        data: { resolvedAt: resolved ? new Date() : null },
        include: withUser,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Report not found');
      }
      throw err;
    }
  }
}
