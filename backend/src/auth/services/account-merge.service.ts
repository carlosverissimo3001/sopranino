import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Transactional } from '@transaction/transactional.decorator';

// Note(Charly): A lot of raw prisma calls in a non-repo file
// not ideal, we should be injecting gameSessionRepo, gauntletRepo...

@Injectable()
export class AccountMergeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Folds `sourceUserId` into `survivorUserId` and deletes the source. Nothing
   * the source carries may raise a privilege on the survivor.
   */
  @Transactional()
  async merge(sourceUserId: string, survivorUserId: string): Promise<void> {
    const [source, survivor] = await Promise.all([
      this.prismaService.user.findUniqueOrThrow({
        where: { id: sourceUserId },
      }),
      this.prismaService.user.findUniqueOrThrow({
        where: { id: survivorUserId },
      }),
    ]);

    // This deletes the source row, so it refuses anything that could be a
    // real account. The caller checks too; this is the primitive's own guard.
    if (source.spotifyUserId || source.googleUserId) {
      throw new BadRequestException('Cannot merge away an account');
    }

    await this.mergeStats(sourceUserId, survivorUserId);
    await this.mergeRoomPlayers(sourceUserId, survivorUserId);

    await this.prismaService.gameSession.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });
    await this.prismaService.gauntletRun.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });

    // Rooms cascade off their host, so an unclaimed room would vanish with the
    // source row rather than follow the player who made it.
    await this.prismaService.multiplayerRoom.updateMany({
      where: { hostId: sourceUserId },
      data: { hostId: survivorUserId },
    });

    await this.prismaService.user.update({
      where: { id: survivorUserId },
      data: {
        answeredQuestionIds: Array.from(
          new Set([
            ...survivor.answeredQuestionIds,
            ...source.answeredQuestionIds,
          ]),
        ),
      },
    });

    // StreakFreezeUsage needs nothing: it cascades, and only a trusted user
    // can have any, which a credential-free row never is.
    await this.prismaService.user.delete({ where: { id: sourceUserId } });
  }

  /**
   * Folds an account whose only way in is Google into the survivor, which
   * takes that Google account over, and its address if it has none of its own.
   *
   * Only for the link flow, where the player has just proved both sides: they
   * are signed in to the survivor and Google vouched for the source. A source
   * with Spotify or a password has a way in of its own, and is refused.
   */
  @Transactional()
  async absorbGoogleOnly(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const [source, survivor] = await Promise.all([
      this.prismaService.user.findUniqueOrThrow({
        where: { id: sourceUserId },
      }),
      this.prismaService.user.findUniqueOrThrow({
        where: { id: survivorUserId },
      }),
    ]);

    if (!source.googleUserId || source.spotifyUserId || source.passwordHash) {
      throw new BadRequestException('Only a Google-only account can be folded');
    }
    if (survivor.googleUserId) {
      throw new BadRequestException('The survivor already has Google');
    }

    // A guest never has these, so merge() leaves them; an account may.
    await this.mergeGroupMemberships(sourceUserId, survivorUserId);
    await this.prismaService.feedback.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });

    // Released first: both columns are unique, and merge() refuses a row that
    // still holds a credential.
    await this.prismaService.user.update({
      where: { id: sourceUserId },
      data: { googleUserId: null, email: null, emailVerifiedAt: null },
    });

    await this.merge(sourceUserId, survivorUserId);

    const takeEmail = !survivor.email && !!source.email;
    await this.prismaService.user.update({
      where: { id: survivorUserId },
      data: {
        googleUserId: source.googleUserId,
        ...(takeEmail && {
          email: source.email,
          emailVerifiedAt: source.emailVerifiedAt,
        }),
      },
    });
  }

  /** Keyed on (user, group): a group both were in keeps the survivor's row. */
  private async mergeGroupMemberships(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const [sourceRows, survivorRows] = await Promise.all([
      this.prismaService.trackGroupMember.findMany({
        where: { userId: sourceUserId },
      }),
      this.prismaService.trackGroupMember.findMany({
        where: { userId: survivorUserId },
      }),
    ]);

    const joined = new Set(survivorRows.map((row) => row.trackGroupId));
    const moving = sourceRows.filter((row) => !joined.has(row.trackGroupId));

    if (moving.length > 0) {
      await this.prismaService.trackGroupMember.createMany({
        data: moving.map((row) => ({ ...row, userId: survivorUserId })),
      });
    }
    // The rest go with the source row, by cascade.
  }

  private async mergeStats(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const rows = await this.prismaService.stats.findMany({
      where: { userId: { in: [sourceUserId, survivorUserId] } },
    });

    const sourceRows = rows.filter((row) => row.userId === sourceUserId);

    for (const from of sourceRows) {
      const into = rows.find(
        (row) => row.userId === survivorUserId && row.mode === from.mode,
      );

      if (!into) {
        await this.prismaService.stats.create({
          data: { ...from, userId: survivorUserId },
        });
        continue;
      }

      await this.prismaService.stats.update({
        where: { userId_mode: { userId: survivorUserId, mode: from.mode } },
        data: {
          totalGames: into.totalGames + from.totalGames,
          totalWins: into.totalWins + from.totalWins,
          currentStreak: Math.max(into.currentStreak, from.currentStreak),
          bestStreak: Math.max(into.bestStreak, from.bestStreak),
          roundDistribution: sumDistributions(
            into.roundDistribution,
            from.roundDistribution,
          ),
          lastWinDate: laterOf(into.lastWinDate, from.lastWinDate),
        },
      });
    }

    // Stats do not cascade, so the source's rows must go before the row does.
    await this.prismaService.stats.deleteMany({
      where: { userId: sourceUserId },
    });
  }

  /** A player cannot be in a room twice: @@unique([roomId, userId]). */
  private async mergeRoomPlayers(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const [sourceRows, survivorRows] = await Promise.all([
      this.prismaService.roomPlayer.findMany({
        where: { userId: sourceUserId },
      }),
      this.prismaService.roomPlayer.findMany({
        where: { userId: survivorUserId },
      }),
    ]);

    const occupied = new Set(survivorRows.map((row) => row.roomId));

    for (const row of sourceRows) {
      if (occupied.has(row.roomId)) {
        await this.prismaService.roomPlayer.delete({ where: { id: row.id } });
        continue;
      }
      await this.prismaService.roomPlayer.update({
        where: { id: row.id },
        data: { userId: survivorUserId },
      });
    }
  }
}

/** Element-wise, over the longer of the two: neither side may be truncated. */
function sumDistributions(a: number[], b: number[]): number[] {
  const length = Math.max(a.length, b.length);
  return Array.from({ length }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0));
}

function laterOf(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
