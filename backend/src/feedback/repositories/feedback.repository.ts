import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackKind, Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { skipTake } from '../../utils/pagination/paginate';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { GetArtistRequestsDto } from '../dto/get-artist-requests.dto';
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
  async findRequestPage(dto: GetArtistRequestsDto) {
    const where: Prisma.FeedbackWhereInput = {
      ...GROUPABLE_REQUESTS,
      ...(dto.resolved !== undefined && {
        resolvedAt: dto.resolved ? { not: null } : null,
      }),
    };

    const grouped = await this.prisma.feedback.groupBy({
      by: ['normalizedMessage'],
      where,
      // Counting resolvedAt counts only the resolved asks, which is the tell.
      _count: { _all: true, resolvedAt: true },
      _max: { createdAt: true },
      orderBy: [{ _count: { id: 'desc' } }, { _max: { createdAt: 'desc' } }],
      ...skipTake(dto),
    });

    const [{ total }] = await this.prisma.$queryRaw<[{ total: number }]>`
      SELECT COUNT(DISTINCT normalized_message)::int AS total
      FROM feedback
      WHERE kind = 'ARTIST_REQUEST'::"FeedbackKind"
        AND normalized_message IS NOT NULL
        ${
          dto.resolved === undefined
            ? Prisma.empty
            : dto.resolved
              ? Prisma.sql`AND resolved_at IS NOT NULL`
              : Prisma.sql`AND resolved_at IS NULL`
        }
    `;

    if (!grouped.length) {
      return { items: [], total };
    }

    // groupBy keeps the key and forgets the spelling, so the newest raw message
    // for each key is fetched back to show.
    const keys = grouped.map((row) => row.normalizedMessage as string);
    const spellings = await this.prisma.feedback.findMany({
      where: { ...where, normalizedMessage: { in: keys } },
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
        key,
        name: newest.get(key) ?? key,
        count: row._count._all,
        lastAskedAt: row._max.createdAt as Date,
        resolved: row._count.resolvedAt === row._count._all,
      };
    });

    return { items, total };
  }

  /** Every ask under one name at once: resolving means the set now exists. */
  async setRequestResolved(key: string, resolved: boolean): Promise<void> {
    const byKey = {
      kind: FeedbackKind.ARTIST_REQUEST,
      normalizedMessage: key,
    };
    const { count } = await this.prisma.feedback.updateMany({
      where: { ...byKey, resolvedAt: resolved ? null : { not: null } },
      data: { resolvedAt: resolved ? new Date() : null },
    });
    // Nothing changed is fine when it was already so; not when nobody asked.
    if (
      count === 0 &&
      (await this.prisma.feedback.count({ where: byKey })) === 0
    ) {
      throw new NotFoundException('Request not found');
    }
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
