import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { skipTake } from '../../utils/pagination/paginate';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { GetFeedbackDto } from '../dto/get-feedback.dto';

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
