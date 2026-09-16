import { Injectable } from '@nestjs/common';
import { PlaylistSource, Prisma, TrackGroupType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { importSlug } from '../consts';

const withImport = {
  import: true,
  _count: { select: { tracks: true } },
} satisfies Prisma.TrackGroupInclude;

export type ImportedGroup = Prisma.TrackGroupGetPayload<{
  include: typeof withImport;
}>;

export interface CreateImportDto {
  userId: string;
  source: PlaylistSource;
  externalId: string;
  name: string;
  imageUrl?: string;
}

@Injectable()
export class PlaylistImportRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByExternal(
    source: PlaylistSource,
    externalId: string,
  ): Promise<ImportedGroup | null> {
    return this.prisma.trackGroup.findFirst({
      where: { import: { source, externalId } },
      include: withImport,
    });
  }

  findById(trackGroupId: string): Promise<ImportedGroup | null> {
    return this.prisma.trackGroup.findFirst({
      where: { id: trackGroupId, type: TrackGroupType.IMPORTED },
      include: withImport,
    });
  }

  /** Throws P2002 when someone else created the same playlist first. */
  create(dto: CreateImportDto): Promise<ImportedGroup> {
    return this.prisma.trackGroup.create({
      data: {
        type: TrackGroupType.IMPORTED,
        name: dto.name,
        slug: importSlug(dto.source, dto.externalId),
        imageUrl: dto.imageUrl,
        import: {
          create: { source: dto.source, externalId: dto.externalId },
        },
        members: { create: { userId: dto.userId } },
      },
      include: withImport,
    });
  }

  async addMember(userId: string, trackGroupId: string): Promise<void> {
    await this.prisma.trackGroupMember.upsert({
      where: { userId_trackGroupId: { userId, trackGroupId } },
      create: { userId, trackGroupId },
      update: {},
    });
  }

  /** Newest first, by when this player added each one. */
  async listForUser(
    userId: string,
  ): Promise<(ImportedGroup & { addedAt: Date })[]> {
    const memberships = await this.prisma.trackGroupMember.findMany({
      where: { userId, trackGroup: { type: TrackGroupType.IMPORTED } },
      orderBy: { createdAt: 'desc' },
      include: { trackGroup: { include: withImport } },
    });
    return memberships.map(({ trackGroup, createdAt }) => ({
      ...trackGroup,
      addedAt: createdAt,
    }));
  }

  /** False when the player was not a member. */
  async removeMember(userId: string, trackGroupId: string): Promise<boolean> {
    const { count } = await this.prisma.trackGroupMember.deleteMany({
      where: { userId, trackGroupId },
    });
    return count > 0;
  }

  countMembers(trackGroupId: string): Promise<number> {
    return this.prisma.trackGroupMember.count({ where: { trackGroupId } });
  }

  async delete(trackGroupId: string): Promise<void> {
    await this.prisma.trackGroup.delete({ where: { id: trackGroupId } });
  }

  async updateAfterFill(
    trackGroupId: string,
    update: { name: string; imageUrl?: string; checksum?: string },
  ): Promise<void> {
    await this.prisma.trackGroup.update({
      where: { id: trackGroupId },
      data: {
        name: update.name,
        ...(update.imageUrl && { imageUrl: update.imageUrl }),
        import: {
          update: {
            checksum: update.checksum ?? null,
            refreshedAt: new Date(),
            staleSince: null,
          },
        },
      },
    });
  }

  async markFresh(trackGroupId: string): Promise<void> {
    await this.prisma.playlistImport.update({
      where: { trackGroupId },
      data: { refreshedAt: new Date(), staleSince: null },
    });
  }

  async markStale(trackGroupId: string): Promise<void> {
    await this.prisma.playlistImport.updateMany({
      where: { trackGroupId, staleSince: null },
      data: { staleSince: new Date(), refreshedAt: new Date() },
    });
  }
}
