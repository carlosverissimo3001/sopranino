import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';
import { UserEntity } from '../entities/user.entity';
import { PrismaService } from '@prisma/prisma.service';
import { UpsertUserDto } from '../dto/upsert-user.dto';
import { AttachSpotifyDto } from '../dto/attach-spotify.dto';
import { isGeneratedHandle } from '../utils/handle-generator';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Finds a user by their ID
   * @param id - The ID of the user
   * @returns The UserEntity
   */
  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    return user ? this.fromPrisma(user) : null;
  }

  /**
   * Ids that exist, of those given. Callers use it to drop players whose row
   * has since gone before fanning out per-user work.
   * @param ids - The IDs to look for
   * @returns The subset that exists
   */
  async findExistingIds(ids: string[]): Promise<string[]> {
    const users = await this.prismaService.user.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  /**
   * Of the given users, those that are accounts rather than anonymous rows.
   * @param ids - The IDs to filter
   * @returns The subset with a credential attached
   */
  async filterWithCredential(ids: string[]): Promise<string[]> {
    const users = await this.prismaService.user.findMany({
      where: { id: { in: ids }, spotifyUserId: { not: null } },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  /**
   * Finds a user by their Spotify user ID
   * @param spotifyUserId - The Spotify user ID of the user
   * @returns The UserEntity
   */
  async findBySpotifyUserId(spotifyUserId: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { spotifyUserId },
    });
    return user ? this.fromPrisma(user) : null;
  }

  /**
   * Upserts a user. On create: sets all fields including displayName.
   * On update: only syncs Spotify-owned fields (avatar, country, isTrusted)
   * so any custom displayName the user has set is preserved.
   */
  async upsert(data: UpsertUserDto): Promise<UserEntity> {
    const existing = await this.prismaService.user.findUnique({
      where: { spotifyUserId: data.spotifyUserId },
    });

    if (!existing) {
      const user = await this.prismaService.user.create({ data });
      return this.fromPrisma(user);
    }

    const user = await this.prismaService.user.update({
      where: { spotifyUserId: data.spotifyUserId },
      data: {
        avatarUrl: data.avatarUrl,
        country: data.country,
        ...(data.isTrusted !== undefined && { isTrusted: data.isTrusted }),
      },
    });
    return this.fromPrisma(user);
  }

  /**
   * Updates the display name for a user.
   */
  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { displayName },
    });
  }

  /** No credentials yet: what makes this row a guest is the absence of them. */
  async createAnonymous(displayName: string): Promise<UserEntity> {
    const user = await this.prismaService.user.create({
      data: { displayName },
    });
    return this.fromPrisma(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    return user ? this.fromPrisma(user) : null;
  }

  /**
   * Settles who owns an address. An unverified email is a claim, not a
   * possession, so proving it takes it off anyone else still claiming it --
   * otherwise verification would protect whoever typed the address first
   * rather than whoever can read the inbox.
   *
   * The other row loses its password with the address. A password built on an
   * address someone else owns is not a way back into anything, and leaving it
   * behind would be an account with a credential and no way to sign in.
   */
  async markEmailVerified(userId: string, email: string): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { email, emailVerifiedAt: null, id: { not: userId } },
        data: { email: null, passwordHash: null },
      });
      await tx.user.update({
        where: { id: userId },
        data: { email, emailVerifiedAt: new Date() },
      });
    });
  }

  async setPassword(userId: string, passwordHash: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  /** Turns an existing row into an account, keeping everything it has played. */
  async attachPassword(
    userId: string,
    email: string,
    passwordHash: string,
  ): Promise<UserEntity> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: { email, passwordHash },
    });
    return this.fromPrisma(user);
  }

  async createWithPassword(
    email: string,
    passwordHash: string,
    displayName: string,
  ): Promise<UserEntity> {
    const user = await this.prismaService.user.create({
      data: { email, passwordHash, displayName },
    });
    return this.fromPrisma(user);
  }

  async attachSpotify(
    userId: string,
    data: AttachSpotifyDto,
  ): Promise<UserEntity> {
    const existing = await this.prismaService.user.findUniqueOrThrow({
      where: { id: userId },
      select: { displayName: true },
    });

    const takeName =
      !!data.displayName && isGeneratedHandle(existing.displayName);

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        spotifyUserId: data.spotifyUserId,
        avatarUrl: data.avatarUrl,
        country: data.country,
        ...(takeName && { displayName: data.displayName }),
      },
    });
    return this.fromPrisma(user);
  }

  async findByGoogleUserId(googleUserId: string): Promise<UserEntity | null> {
    const user = await this.prismaService.user.findUnique({
      where: { googleUserId },
    });
    return user ? this.fromPrisma(user) : null;
  }

  /**
   * Adds Google to an account already holding the address Google vouched for.
   * Google proving the inbox settles who owns it: if the row had only claimed
   * the address, its password goes, because whoever set it may not be the
   * person who can read the mail. They can set a new one through a reset.
   */
  async linkGoogle(userId: string, googleUserId: string): Promise<UserEntity> {
    const user = await this.prismaService.$transaction(async (tx) => {
      const row = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { emailVerifiedAt: true },
      });
      return tx.user.update({
        where: { id: userId },
        data: {
          googleUserId,
          ...(!row.emailVerifiedAt && {
            emailVerifiedAt: new Date(),
            passwordHash: null,
          }),
        },
      });
    });
    return this.fromPrisma(user);
  }

  /** Adds Google as another way into an account the player is signed in to. */
  async setGoogleUserId(userId: string, googleUserId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { googleUserId },
    });
  }

  /**
   * Turns a guest row into a Google account, keeping everything it has played.
   * The address is only stored when Google has verified it.
   */
  async attachGoogle(
    userId: string,
    googleUserId: string,
    verifiedEmail?: string,
  ): Promise<UserEntity> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        googleUserId,
        ...(verifiedEmail && {
          email: verifiedEmail,
          emailVerifiedAt: new Date(),
        }),
      },
    });
    return this.fromPrisma(user);
  }

  async createWithGoogle(
    googleUserId: string,
    displayName: string,
    verifiedEmail?: string,
  ): Promise<UserEntity> {
    const user = await this.prismaService.user.create({
      data: {
        googleUserId,
        displayName,
        ...(verifiedEmail && {
          email: verifiedEmail,
          emailVerifiedAt: new Date(),
        }),
      },
    });
    return this.fromPrisma(user);
  }

  /**
   * Maps a Prisma user to a UserEntity
   * @param user - The Prisma user
   * @returns The UserEntity
   */
  private fromPrisma(user: PrismaUser): UserEntity {
    return {
      ...user,
      spotifyUserId: user.spotifyUserId ?? undefined,
      googleUserId: user.googleUserId ?? undefined,
      email: user.email ?? undefined,
      passwordHash: user.passwordHash ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      customAvatarUrl: user.customAvatarUrl ?? undefined,
      country: user.country ?? undefined,
      emailVerifiedAt: user.emailVerifiedAt ?? undefined,
    };
  }

  /**
   * Checks if a user is trusted
   * @param spotifyUserId - The Spotify user ID of the user
   * @returns True if the user is trusted, false otherwise
   */
  async isTrusted(spotifyUserId: string): Promise<boolean> {
    const user = await this.findBySpotifyUserId(spotifyUserId);
    return user?.isTrusted ?? false;
  }

  /**
   * Updates the encrypted refresh token for a user
   */
  async updateRefreshToken(
    spotifyUserId: string,
    encryptedRefreshToken: string,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { spotifyUserId },
      data: { encryptedRefreshToken },
    });
  }

  /**
   * Gets the encrypted refresh token for a user
   */
  async getRefreshToken(spotifyUserId: string): Promise<string | undefined> {
    const user = await this.prismaService.user.findUnique({
      where: { spotifyUserId },
      select: { encryptedRefreshToken: true },
    });
    return user?.encryptedRefreshToken ?? undefined;
  }
}
