import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { PlaylistSource, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { AuthService } from '../../auth/services/auth.service';
import { FILL_PLAYLIST_IMPORT_JOB, PLAYLIST_IMPORT_QUEUE } from '../../consts';
import { AppLoggerService } from '../../logger/logger.service';
import { PoolService } from '../../pool/services/pool.service';
import { RedisService } from '../../redis/redis.service';
import {
  IMPORT_DAILY_TTL_SECONDS,
  IMPORT_MAX_TRACKS,
  IMPORT_QUEUE_CEILING,
  IMPORT_REFRESH_AFTER_MS,
  importDailyKey,
} from '../consts';
import { ImportPlaylistControllerDto } from '../dto/import-playlist-controller.dto';
import { ImportedSetDto } from '../dto/imported-set.dto';
import {
  PlaylistImportRepository,
  type ImportedGroup,
} from '../repositories/playlist-import.repository';
import {
  PLAYLIST_PROVIDERS,
  PlaylistUnavailableError,
  type PlaylistInfo,
  type PlaylistProvider,
} from '../providers/playlist-provider';
import { TrackGroupService } from '../../track-group/services/track-group.service';
import type { SetMemberDto } from '../../track-group/dto/set-member.dto';
import { Transactional } from '@transaction/transactional.decorator';
import { SOURCE_NAMES } from '../validators/is-playlist-link.validator';

const EXTERNAL_URLS: Record<PlaylistSource, (id: string) => string> = {
  [PlaylistSource.DEEZER]: (id) => `https://www.deezer.com/playlist/${id}`,
  [PlaylistSource.SPOTIFY]: (id) => `https://open.spotify.com/playlist/${id}`,
  [PlaylistSource.APPLE_MUSIC]: (id) =>
    `https://music.apple.com/playlist/${id}`,
};

@Injectable()
export class PlaylistImportService {
  private readonly logger: AppLoggerService;
  private readonly providers: Map<PlaylistSource, PlaylistProvider>;

  constructor(
    private readonly repository: PlaylistImportRepository,
    private readonly authService: AuthService,
    private readonly poolService: PoolService,
    private readonly trackGroupService: TrackGroupService,
    private readonly redis: RedisService,
    @InjectQueue(PLAYLIST_IMPORT_QUEUE) private readonly queue: Queue,
    @Inject(PLAYLIST_PROVIDERS) providers: PlaylistProvider[],
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(PlaylistImportService.name);
    this.providers = new Map(
      providers.map((provider) => [provider.source, provider]),
    );
  }

  async import(
    sessionId: string,
    { source, link }: ImportPlaylistControllerDto,
  ): Promise<ImportedSetDto> {
    const user = await this.authService.getUserBySessionId(sessionId);
    const provider = this.providers.get(source);
    if (!provider) {
      throw new UnprocessableEntityException(
        `Importing from ${SOURCE_NAMES[source]} is not supported yet`,
      );
    }

    const externalId = await provider.resolveId(link);
    if (!externalId) {
      throw new BadRequestException(
        `That is not a ${SOURCE_NAMES[source]} playlist link`,
      );
    }

    // Someone already brought it in: joining costs the service nothing.
    const existing = await this.repository.findByExternal(source, externalId);
    if (existing) {
      await this.repository.addMember(user.id, existing.id);
      return this.toDto(existing);
    }

    const waiting = await this.queue.getWaitingCount();
    if (waiting >= IMPORT_QUEUE_CEILING) {
      throw new ServiceUnavailableException(
        'Too many playlists are being imported right now. Try again in a few minutes.',
      );
    }

    const info = await this.readInfo(provider, externalId);
    if (info.trackCount > IMPORT_MAX_TRACKS) {
      throw new BadRequestException(
        `That playlist has ${info.trackCount} songs; the most we can import is ${IMPORT_MAX_TRACKS}`,
      );
    }

    // Claimed last, so a bad link or a private playlist does not spend the day.
    const claimed = await this.redis
      .getClient()
      .set(importDailyKey(user.id), '1', 'EX', IMPORT_DAILY_TTL_SECONDS, 'NX');
    if (!claimed) {
      throw new HttpException(
        'One new playlist a day. Playlists someone else already imported can still be added.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let group: ImportedGroup;
    try {
      group = await this.repository.create({
        userId: user.id,
        source,
        externalId,
        name: info.title,
        imageUrl: info.imageUrl,
      });
    } catch (err) {
      await this.redis.getClient().del(importDailyKey(user.id));
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const raced = await this.repository.findByExternal(source, externalId);
        if (raced) {
          await this.repository.addMember(user.id, raced.id);
          return this.toDto(raced);
        }
      }
      throw err;
    }

    await this.enqueueFill(group.id);
    return this.toDto(group);
  }

  async list(sessionId: string): Promise<ImportedSetDto[]> {
    const user = await this.authService.getUserBySessionId(sessionId);
    const groups = await this.repository.listForUser(user.id);

    // Refreshed when looked at rather than on a timer: a playlist nobody opens
    // costs nothing.
    const cutoff = Date.now() - IMPORT_REFRESH_AFTER_MS;
    await Promise.all(
      groups
        .filter(
          (group) =>
            group.import?.refreshedAt &&
            group.import.refreshedAt.getTime() < cutoff,
        )
        .map((group) => this.enqueueFill(group.id)),
    );

    return groups.map((group) => this.toDto(group, group.addedAt));
  }

  /** The set goes with its last member; past games keep their tracks. */
  @Transactional()
  async leave(sessionId: string, trackGroupId: string): Promise<void> {
    const user = await this.authService.getUserBySessionId(sessionId);
    if (!(await this.repository.removeMember(user.id, trackGroupId))) {
      throw new NotFoundException(`No import ${trackGroupId}`);
    }
    if ((await this.repository.countMembers(trackGroupId)) === 0) {
      await this.repository.delete(trackGroupId);
      this.poolService.forget(trackGroupId);
    }
  }

  async fill(trackGroupId: string): Promise<void> {
    const group = await this.repository.findById(trackGroupId);
    if (!group?.import) {
      return;
    }
    const { source, externalId, checksum, refreshedAt } = group.import;
    const provider = this.providers.get(source);
    if (!provider) {
      this.logger.warn(`No provider for ${source}; leaving ${trackGroupId}`);
      return;
    }

    try {
      const info = await provider.info(externalId);
      if (refreshedAt && info.checksum && info.checksum === checksum) {
        await this.repository.markFresh(trackGroupId);
        return;
      }

      const members = await provider.members(externalId, IMPORT_MAX_TRACKS);
      await this.store(trackGroupId, info, members);
    } catch (err) {
      if (err instanceof PlaylistUnavailableError) {
        await this.repository.markStale(trackGroupId);
        return;
      }
      throw err;
    }
  }

  @Transactional({ timeout: 60_000 })
  private async store(
    trackGroupId: string,
    info: PlaylistInfo,
    members: SetMemberDto[],
  ): Promise<void> {
    await this.trackGroupService.replaceMembers(trackGroupId, members);
    await this.repository.updateAfterFill(trackGroupId, {
      name: info.title,
      imageUrl: info.imageUrl,
      checksum: info.checksum,
    });
  }

  private async readInfo(provider: PlaylistProvider, externalId: string) {
    try {
      return await provider.info(externalId);
    } catch (err) {
      if (err instanceof PlaylistUnavailableError) {
        throw new NotFoundException(
          'That playlist is private or no longer exists',
        );
      }
      throw err;
    }
  }

  private async enqueueFill(trackGroupId: string): Promise<void> {
    // One job per set at a time; removed when done, or the id would block the
    // next refresh for as long as finished jobs are kept.
    await this.queue.add(
      FILL_PLAYLIST_IMPORT_JOB,
      { trackGroupId },
      {
        jobId: `fill-${trackGroupId}`,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  private toDto(group: ImportedGroup, addedAt?: Date): ImportedSetDto {
    const imported = group.import!;
    return {
      id: group.id,
      type: group.type,
      name: group.name,
      slug: group.slug,
      trackCount: group._count.tracks,
      imageUrl: group.imageUrl ?? undefined,
      source: imported.source,
      externalUrl: EXTERNAL_URLS[imported.source](imported.externalId),
      pending: !imported.refreshedAt,
      staleSince: imported.staleSince ?? undefined,
      addedAt,
    };
  }
}
