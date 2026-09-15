import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPreference } from '@prisma/client';
import { UserPreferenceDto } from '../dto/user-preference.dto';

@Injectable()
export class UserPreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserPreferenceDto> {
    const preference = await this.prisma.userPreference.findUnique({
      where: { userId },
    });
    return preference ? this.fromPrisma(preference) : this.defaultPreferences();
  }

  async upsert(
    userId: string,
    data: Partial<
      Pick<
        UserPreference,
        | 'showAlbumHint'
        | 'showTextHints'
        | 'showGuessHistory'
        | 'showStatsToOthers'
        | 'timezone'
      >
    >,
  ): Promise<UserPreferenceDto> {
    const preference = await this.prisma.userPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return this.fromPrisma(preference);
  }

  fromPrisma(prefs: UserPreference): UserPreferenceDto {
    return {
      ...prefs,
    };
  }

  defaultPreferences(): UserPreferenceDto {
    return {
      showAlbumHint: true,
      showTextHints: true,
      showGuessHistory: true,
      showStatsToOthers: true,
      timezone: 'UTC',
    };
  }
}
