import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TrackEntity } from '../entities/track.entity';
import { UpsertTrackDto } from '../dto/upsert-track.dto';
import { TrackMetadataVo } from '../vo/track-metadata.vo';
import { mapTrack } from '../../utils/mappers';

@Injectable()
export class TrackRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a track by its ID
   * @param id - The ID of the track
   * @returns The Track if found, null otherwise
   */
  async findById(id: string): Promise<TrackEntity | null> {
    const track = await this.prisma.track.findUnique({
      where: { id },
    });
    return track ? mapTrack(track) : null;
  }

  async findMany(ids: string[]): Promise<TrackEntity[]> {
    const tracks = await this.prisma.track.findMany({
      where: { id: { in: ids } },
    });
    return tracks.map((track) => mapTrack(track));
  }

  /**
   * Upserts a track (creates if it doesn't exist, updates if it does)
   * Automatically updates lastScrapedAt when the track is updated
   * @param id - The ID of the track
   * @param data - The partial track data to upsert
   * @returns The upserted Track
   */
  async upsertTrack(id: string, data: UpsertTrackDto): Promise<TrackEntity> {
    const track = await this.prisma.track.upsert({
      where: { id },
      update: {
        ...data,
        metadata: data.metadata as unknown as Prisma.InputJsonObject,
      },
      create: {
        id,
        ...data,
        metadata: data.metadata as unknown as Prisma.InputJsonObject,
      },
    });
    return mapTrack(track);
  }

  async createMissing(tracks: Prisma.TrackCreateManyInput[]): Promise<void> {
    if (!tracks.length) return;
    await this.prisma.track.createMany({ data: tracks, skipDuplicates: true });
  }

  async updateMetadata(id: string, metadata: TrackMetadataVo): Promise<void> {
    await this.prisma.track.update({
      where: { id },
      data: { metadata: metadata as unknown as Prisma.InputJsonObject },
    });
  }
}
