'use client';

import { AppHeader } from '@/components/features/AppHeader';
import { AppFooter } from '@/components/features/AppFooter';
import { useMe } from '@/hooks/auth/useMe';
import { useLogout } from '@/hooks/auth/useLogout';
import { useGauntletRun } from '@/hooks/speed-run/useSpeedRun';
import { useVolume } from '@/hooks/game/useVolume';
import { usePersonalBest } from '@/hooks/speed-run/useSpeedRunPersonalBest';
import { SpeedRunSetup } from './SpeedRunSetup';
import { SpeedRunGameScreen } from './SpeedRunGameScreen';

export function SpeedRunPage() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const { volume, setVolume } = useVolume();
  const run = useGauntletRun();
  const { data: pbData } = usePersonalBest();
  const personalBest = pbData?.personalBest ?? 0;

  return (
    <main className="min-h-screen flex flex-col relative overflow-x-hidden text-fg">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-spotify-black dark:via-[#0d1117] dark:to-[#161b22]" />
        {run.phase === 'PLAYING' && run.score >= 5 && (
          <div
            className="absolute inset-0 transition-opacity duration-1000 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, rgba(251,146,60,${Math.min(run.score * 0.008, 0.12)}), transparent 60%)`,
            }}
          />
        )}
      </div>

      <AppHeader
        user={user}
        onLogout={() => logoutMutation.mutate()}
        isLoggingOut={logoutMutation.isPending}
      />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        <div className="max-w-xl mx-auto">
          {run.phase === 'IDLE' ? (
            <SpeedRunSetup
              onStart={run.startRun}
              isStarting={run.isStarting}
              startError={run.startError}
              personalBest={personalBest}
            />
          ) : (
            <SpeedRunGameScreen
              run={run}
              volume={volume}
              onVolumeChange={setVolume}
              personalBest={personalBest}
            />
          )}
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
