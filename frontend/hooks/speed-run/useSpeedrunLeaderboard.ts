'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { api } from '@/sdk/client';
import {
  GauntletControllerGetLeaderboardDifficultyEnum,
  GauntletControllerGetLeaderboardPeriodEnum,
} from '@/sdk/apis/ApiApi';

export type LeaderboardPeriod = GauntletControllerGetLeaderboardPeriodEnum;
export type LeaderboardDifficulty =
  GauntletControllerGetLeaderboardDifficultyEnum;

export function useGauntletLeaderboard(
  period: LeaderboardPeriod,
  difficulty: LeaderboardDifficulty,
) {
  return useQuery({
    queryKey: queryKeys.gauntlet.leaderboard(period, difficulty),
    queryFn: () =>
      api.gauntletControllerGetLeaderboard({ period, difficulty, limit: 50 }),
  });
}
