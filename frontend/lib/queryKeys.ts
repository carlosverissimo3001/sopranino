import {
  PlaylistControllerGetMyPlaylistsSortByEnum as PlaylistSortBy,
  StartRunDtoDifficultyEnum as GauntletDifficulty,
} from '@sdk';

/**
 * Centralized query keys factory for consistent cache invalidation
 * Follows TanStack Query best practices for hierarchical keys
 */
export const queryKeys = {
  // Game-related queries
  game: {
    all: ['game'] as const,
    /** Cache-only: set by start-game onSuccess so remounted component sees sessionId and re-renders */
    startedSessionForPlaylist: (playlistId: string) =>
      ['game', 'startedSession', 'playlist', playlistId] as const,
    startedSessionForDaily: ['game', 'startedSession', 'daily'] as const,
    startedSessionForGroup: (trackGroupId: string) =>
      ['game', 'startedSession', 'group', trackGroupId] as const,
    session: (sessionId: string) => ['game', 'session', sessionId] as const,
    state: (sessionId: string) =>
      ['game', 'session', sessionId, 'state'] as const,
    allHistory: ['game', 'history'] as const,
    history: (params?: {
      mode?: string;
      page?: number;
      limit?: number;
      search?: string;
      status?: string[];
      from?: string;
      to?: string;
    }) => ['game', 'history', params] as const,
    allStats: ['game', 'stats'] as const,
    stats: (mode?: string) => ['game', 'stats', mode] as const,
    playedToday: ['game', 'playedToday'] as const,
    share: (gameId: string) => ['game', 'share', gameId] as const,
  },
  // Playlist-related queries
  playlists: {
    all: ['playlists'] as const,
    me: (params?: {
      limit?: number;
      offset?: number;
      onlyPublic?: boolean;
      onlyPrivate?: boolean;
      sortBy?: PlaylistSortBy;
    }) => ['playlists', 'me', params] as const,
    detail: (playlistId: string) => ['playlists', playlistId] as const,
  },
  // Auth-related queries
  trackGroups: {
    all: ['trackGroups'] as const,
    byType: (type: string) => ['trackGroups', type] as const,
    bySlug: (slug: string) => ['trackGroups', 'slug', slug] as const,
  },
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
  },
  // Streak queries
  streak: {
    all: ['streak'] as const,
    status: ['streak', 'status'] as const,
    quiz: ['streak', 'quiz'] as const,
  },
  // Admin queries
  admin: {
    all: ['admin'] as const,
    streakQuestions: ['admin', 'streakQuestions'] as const,
    users: ['admin', 'users'] as const,
  },
  // Multiplayer queries
  multiplayer: {
    all: ['multiplayer'] as const,
    room: (roomId: string) => ['multiplayer', 'room', roomId] as const,
    round: (roomId: string) => ['multiplayer', 'round', roomId] as const,
    scoreboard: (roomId: string) =>
      ['multiplayer', 'scoreboard', roomId] as const,
  },
  // User preferences queries
  userPreferences: {
    all: ['userPreferences'] as const,
    me: ['userPreferences', 'me'] as const,
  },
  // Search queries
  search: {
    all: ['search'] as const,
    tracks: (query: string) => ['search', 'tracks', query] as const,
  },
  // Gauntlet queries
  gauntlet: {
    all: ['gauntlet'] as const,
    personalBest: ['gauntlet', 'personalBest'] as const,
    leaderboard: (period?: string, difficulty?: string) =>
      ['gauntlet', 'leaderboard', period, difficulty] as const,
    allHistory: ['gauntlet', 'history'] as const,
    history: (params?: {
      page?: number;
      limit?: number;
      difficulty?: GauntletDifficulty;
    }) => ['gauntlet', 'history', params] as const,
  },
  // Daily game queries
  daily: {
    all: ['daily'] as const,
    allHistory: ['daily', 'history'] as const,
    history: (params?: { limit?: number; offset?: number }) =>
      ['daily', 'history', params] as const,
  },
} as const;
