import { Injectable } from '@nestjs/common';
import { AuthToken, AuthTokenType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class AuthTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Issuing a new link retires every older one of the same kind for that user.
   * Two working links for one purpose means the older mail stays useful long
   * after the person asked for a replacement.
   */
  async issue(params: {
    userId: string;
    email: string;
    type: AuthTokenType;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.authToken.deleteMany({
        where: { userId: params.userId, type: params.type },
      }),
      this.prisma.authToken.create({ data: params }),
    ]);
  }

  findByHash(
    tokenHash: string,
    type: AuthTokenType,
  ): Promise<AuthToken | null> {
    return this.prisma.authToken.findFirst({ where: { tokenHash, type } });
  }

  findLive(userId: string, type: AuthTokenType): Promise<AuthToken | null> {
    return this.prisma.authToken.findFirst({
      where: { userId, type, expiresAt: { gt: new Date() } },
    });
  }

  async retire(userId: string, types: AuthTokenType[]): Promise<void> {
    await this.prisma.authToken.deleteMany({
      where: { userId, type: { in: types } },
    });
  }

  async consume(id: string): Promise<void> {
    await this.prisma.authToken.delete({ where: { id } });
  }

  /** Expired rows are dead weight; nothing reads them and they name addresses. */
  async deleteExpired(): Promise<number> {
    const { count } = await this.prisma.authToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }
}
