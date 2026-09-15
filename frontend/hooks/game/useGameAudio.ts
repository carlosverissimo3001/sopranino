'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  peekAudioContextState,
  primeAudioContextOnFirstGesture,
} from '@/lib/audio-context';
import { logAudio } from '@/lib/audio-debug';
import { holdAudioSession, isAudioSessionHeld } from '@/lib/audio-session';
import {
  GuessAudioDtoPathEnum as SnippetPath,
  type GuessAudioDto,
} from '@/sdk';
import { keepPreviewUrl } from '@/lib/preview-url';
import { useMediaSession } from '../useMediaSession';
import { useSnippetAudio } from './useSnippetAudio';

interface UseGameAudioOptions {
  previewUrl: string | null | undefined;
  isGameOver: boolean;
  snippetDuration: number;
  /** The longest snippet any round reaches, so the player knows what is used. */
  maxSnippetDuration?: number;
  volume: number;
}

/** readyState: enough decoded to play the current position. */
const HAVE_CURRENT_DATA = 2;

export function useGameAudio({
  previewUrl: incomingUrl,
  isGameOver,
  snippetDuration,
  maxSnippetDuration = 12,
  volume,
}: UseGameAudioOptions) {
  // Every read of a round re-signs its link. Taking each one would reload the
  // audio and restart the reveal; the same song keeps the link it has.
  const [heldUrl, setHeldUrl] = useState(incomingUrl);
  const previewUrl = keepPreviewUrl(heldUrl, incomingUrl);
  if (previewUrl !== heldUrl) {
    setHeldUrl(previewUrl);
  }

  const audioRef = useRef<HTMLAudioElement>(null);
  const fullAudioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullSongPlaying, setIsFullSongPlaying] = useState(false);

  const requestRef = useRef<number | null>(null);

  // Per round: a new snippet length or a new song starts the count again.
  const playedPathRef = useRef<SnippetPath | null>(null);
  useEffect(() => {
    playedPathRef.current = null;
  }, [previewUrl, snippetDuration]);

  /** True while the reveal plays through the decoded buffer rather than the element. */
  const fullSongOnBufferRef = useRef(false);
  /** Where a paused reveal resumes from, in seconds into the preview. */
  const fullSongPositionRef = useRef<number | null>(null);

  const handleSnippetEnded = useCallback(() => {
    setIsPlaying(false);
    if (fullSongOnBufferRef.current) {
      fullSongOnBufferRef.current = false;
      fullSongPositionRef.current = null;
      setIsFullSongPlaying(false);
    }
  }, []);
  const snippet = useSnippetAudio({
    previewUrl,
    volume,
    window: maxSnippetDuration,
    onEnded: handleSnippetEnded,
  });

  // True once the iOS audio hardware session has been initialized.
  // Reset on each new track and whenever the audio session may have been
  // interrupted (tab hidden, incoming call, etc.).
  const isWarmedUp = useRef(false);

  // Set to true when the user taps play while background warmup is still
  // running, so the warmup setTimeout knows to bail instead of conflicting.
  const warmupAbortRef = useRef(false);

  // Monotonically increasing ID — only the latest playSnippet call may start
  // playback; prevents stale callbacks from queued rapid taps.
  const playRequestIdRef = useRef(0);

  // Separate timer refs for background vs inline warmup so they never
  // clobber each other's handles.
  const bgWarmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inlineWarmupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    if (audioRef.current) audioRef.current.volume = volume;
    if (fullAudioRef.current) fullAudioRef.current.volume = volume;
  }, [volume]);

  // Started on the first touch of the page, not on the tap that wants audio:
  // by then the hardware is already running.
  useEffect(() => primeAudioContextOnFirstGesture(), []);

  // ─── Reset warmup whenever the track changes (new game) ───────────────────
  // The iOS audio session is scoped to the current playback context. When the
  // src changes, the old warmup is invalidated. Cancel any in-flight warmup
  // timer so its callback cannot set isWarmedUp for the new track.
  useEffect(() => {
    if (bgWarmupTimerRef.current !== null) {
      clearTimeout(bgWarmupTimerRef.current);
      bgWarmupTimerRef.current = null;
    }
    if (inlineWarmupTimerRef.current !== null) {
      clearTimeout(inlineWarmupTimerRef.current);
      inlineWarmupTimerRef.current = null;
    }
    isWarmedUp.current = false;
    warmupAbortRef.current = false;
  }, [previewUrl]);

  // ─── Reset warmup when the tab regains visibility ─────────────────────────
  // iOS interrupts the audio session when the user backgrounds the app,
  // locks the screen, or takes a phone call. visibilitychange is the most
  // reliable cross-browser signal for this.
  useEffect(() => {
    if (!(navigator.maxTouchPoints > 0)) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        isWarmedUp.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ─── Background warmup ────────────────────────────────────────────────────
  // On mobile, silently play+pause the audio element as soon as it has data.
  // This initialises the OS audio session so the first user-tapped snippet
  // plays immediately instead of being swallowed by the ~200ms session startup.
  // We rely on autoplay policy allowing a low-volume play here; if it's
  // blocked the user's tap will trigger an inline warmup instead.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;

    const isMobile = navigator.maxTouchPoints > 0;
    if (!isMobile) {
      isWarmedUp.current = true;
      return;
    }

    // Only the fallback plays this element. On iOS the warmup is audible
    // (volume is read-only) and can interrupt the context snippets use.
    // Waits on the decode, not just its result: the two race.
    if (snippet.status !== 'failed') {
      isWarmedUp.current = snippet.isReady;
      return;
    }

    const runWarmup = () => {
      // Bail if the user already tapped (inline warmup will handle it) or if
      // the warmup was already completed for this track.
      if (isWarmedUp.current || warmupAbortRef.current) return;

      audio.volume = 0;
      audio.currentTime = 0;

      audio
        .play()
        .then(() => {
          bgWarmupTimerRef.current = setTimeout(() => {
            bgWarmupTimerRef.current = null;
            if (warmupAbortRef.current) {
              // User tapped while we were warming up — they already handled it.
              warmupAbortRef.current = false;
              return;
            }
            audio.pause();
            audio.currentTime = 0;
            audio.volume = volumeRef.current;
            isWarmedUp.current = true;
          }, 150);
        })
        .catch(() => {
          // Autoplay blocked — warmup will happen inline on first tap instead.
          audio.volume = volumeRef.current;
          audio.currentTime = 0;
        });
    };

    if (audio.readyState >= 3) {
      runWarmup();
    } else {
      audio.addEventListener('canplaythrough', runWarmup, { once: true });
      return () => audio.removeEventListener('canplaythrough', runWarmup);
    }
  }, [previewUrl, snippet.isReady, snippet.status]);

  // Held in a ref so stopAudioInternal keeps a stable identity — it is a
  // dependency of half the callbacks in here.
  const snippetStopRef = useRef(snippet.stop);
  const snippetRef = useRef(snippet);
  useEffect(() => {
    snippetStopRef.current = snippet.stop;
    snippetRef.current = snippet;
  }, [snippet]);

  const stopAudioInternal = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    // Cancel any pending warmup timer and invalidate its startPlayback callback.
    if (bgWarmupTimerRef.current !== null) {
      clearTimeout(bgWarmupTimerRef.current);
      bgWarmupTimerRef.current = null;
    }
    if (inlineWarmupTimerRef.current !== null) {
      clearTimeout(inlineWarmupTimerRef.current);
      inlineWarmupTimerRef.current = null;
    }
    // Bump the request ID so any in-flight startPlayback() call becomes stale.
    ++playRequestIdRef.current;
    snippetStopRef.current();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  // Which path a track took, for debugging sound on a device with no console.
  const loggedPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !previewUrl) return;
    if (snippet.status !== 'ready' && snippet.status !== 'failed') return;
    if (loggedPathRef.current === previewUrl) return;
    loggedPathRef.current = previewUrl;
    logAudio(
      `decode ${snippet.status} -> ${snippet.status === 'ready' ? 'web-audio' : 'element'}`,
    );
    console.log(
      `[useGameAudio] snippets via ${
        snippet.status === 'ready' ? 'web-audio' : 'audio-element (fallback)'
      }`,
    );
  }, [previewUrl, snippet.status]);

  /** The fallback, callable on its own: Web Audio can refuse at play time. */
  const playViaElement = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    logAudio(`element play, readyState=${audio.readyState}`);

    const isMobile = navigator.maxTouchPoints > 0;
    const durationMs = snippetDuration * 1000 + 100;
    // Add a small buffer on mobile to compensate for iOS fade-in latency.
    const adjustedDuration = isMobile ? durationMs + 60 : durationMs;
    const requestId = ++playRequestIdRef.current;

    const startPlayback = () => {
      if (requestId !== playRequestIdRef.current) return;

      audio.currentTime = 0;
      audio.volume = volumeRef.current;

      audio
        .play()
        .then(() => {
          setIsPlaying(true);

          const startTime = performance.now();
          const checkTime = () => {
            if (performance.now() - startTime >= adjustedDuration) {
              stopAudioInternal();
            } else {
              requestRef.current = requestAnimationFrame(checkTime);
            }
          };
          requestRef.current = requestAnimationFrame(checkTime);
        })
        .catch((err: unknown) => {
          console.warn('[useGameAudio] play() rejected:', err);
          setIsPlaying(false);
        });
    };

    if (!isWarmedUp.current && isMobile) {
      // Background warmup didn't complete (autoplay blocked, or still running).
      // Signal any in-progress warmup to abort, then do an inline warmup under
      // this user gesture. We wait 150ms — the same window the background
      // warmup uses — to let iOS fully initialise the audio hardware session
      // before starting real playback.
      warmupAbortRef.current = true;

      audio.volume = 0;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => {
          inlineWarmupTimerRef.current = setTimeout(() => {
            inlineWarmupTimerRef.current = null;
            if (requestId !== playRequestIdRef.current) {
              // A newer tap arrived during the warmup window — bail out cleanly.
              audio.pause();
              audio.currentTime = 0;
              audio.volume = volumeRef.current;
              return;
            }
            audio.pause();
            audio.currentTime = 0;
            isWarmedUp.current = true;
            warmupAbortRef.current = false;
            startPlayback();
          }, 150);
        })
        .catch(() => {
          // play() failed even under user gesture — skip warmup and try direct.
          isWarmedUp.current = true;
          warmupAbortRef.current = false;
          startPlayback();
        });
    } else {
      startPlayback();
    }
  }, [snippetDuration, stopAudioInternal]);

  const playSnippet = useCallback(() => {
    if (!previewUrl) return;

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // Decoded: starts on the next audio callback, and lasts exactly as asked.
    if (snippet.isReady) {
      // Every tap, not only the first: the session is dropped by an
      // interruption the same way the context is.
      holdAudioSession();
      logAudio(`tap: web-audio, ${snippetDuration}s`);
      if (snippet.play(snippetDuration)) {
        playedPathRef.current = SnippetPath.WebAudio;
        setIsPlaying(true);
        return;
      }
      logAudio('web-audio refused; falling back to element');
      // The context would not run; the element is unaffected by that.
      playedPathRef.current = SnippetPath.Element;
      playViaElement();
      return;
    }

    playedPathRef.current = SnippetPath.Element;
    playViaElement();
  }, [snippetDuration, previewUrl, snippet, playViaElement]);

  const pauseSnippet = useCallback(() => {
    stopAudioInternal();
  }, [stopAudioInternal]);

  // Clean up RAF and any pending warmup timers on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (bgWarmupTimerRef.current !== null)
        clearTimeout(bgWarmupTimerRef.current);
      if (inlineWarmupTimerRef.current !== null)
        clearTimeout(inlineWarmupTimerRef.current);
    };
  }, []);

  const toggleFullSong = useCallback(() => {
    const player = snippetRef.current;
    if (fullSongOnBufferRef.current) {
      fullSongPositionRef.current = player.position();
      fullSongOnBufferRef.current = false;
      player.stop();
      setIsFullSongPlaying(false);
      return;
    }
    if (
      player.isReady &&
      player.playFull(fullSongPositionRef.current ?? undefined)
    ) {
      holdAudioSession();
      fullSongOnBufferRef.current = true;
      setIsFullSongPlaying(true);
      return;
    }

    if (!fullAudioRef.current) return;

    if (fullAudioRef.current.paused) {
      fullAudioRef.current.volume = volumeRef.current;
      // The element's own play event flips the icon, not this call.
      void fullAudioRef.current.play().catch(() => {});
    } else {
      fullAudioRef.current.pause();
    }
  }, []);

  const stopFullSong = useCallback(() => {
    if (fullSongOnBufferRef.current) {
      fullSongOnBufferRef.current = false;
      snippetRef.current.stop();
    }
    fullSongPositionRef.current = null;
    if (fullAudioRef.current) {
      fullAudioRef.current.pause();
      fullAudioRef.current.currentTime = 0;
    }
    setIsFullSongPlaying(false);
  }, []);

  // The icon follows the element: a resolved play() is not audible playback.
  useEffect(() => {
    const fullAudio = fullAudioRef.current;
    if (!fullAudio) return;

    const onPlaying = () => setIsFullSongPlaying(true);
    const onStopped = () => setIsFullSongPlaying(false);

    fullAudio.addEventListener('playing', onPlaying);
    fullAudio.addEventListener('pause', onStopped);
    fullAudio.addEventListener('ended', onStopped);
    fullAudio.addEventListener('emptied', onStopped);

    return () => {
      fullAudio.removeEventListener('playing', onPlaying);
      fullAudio.removeEventListener('pause', onStopped);
      fullAudio.removeEventListener('ended', onStopped);
      fullAudio.removeEventListener('emptied', onStopped);
    };
  }, [isGameOver, previewUrl]);

  // Intercept OS media keys so hardware play/pause can't bypass snippet timing
  const mediaSessionCallbacks = useMemo(
    () =>
      isGameOver
        ? { onPlay: toggleFullSong, onPause: toggleFullSong }
        : { onPlay: playSnippet, onPause: pauseSnippet },
    [isGameOver, toggleFullSong, playSnippet, pauseSnippet],
  );

  useMediaSession({
    enabled: !!previewUrl,
    ...mediaSessionCallbacks,
  });

  /**
   * Which preview the reveal played, so a re-minted link cannot replay it.
   * Marked on start, not on attempt: a guard set up front outlives the cleanup
   * that removes the listener it waits on, and Strict Mode's second pass bails.
   */
  const revealPlayedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isGameOver) {
      revealPlayedForRef.current = null;
    }
  }, [isGameOver]);

  useEffect(() => {
    if (!isGameOver || !previewUrl) return;
    if (revealPlayedForRef.current === previewUrl) return;

    let cleanupReveal: (() => void) | undefined;

    // A snippet still sounding carries on into the song instead of jumping back,
    // whichever path played it: the element's clock is the file's own. Read
    // before the element is stopped below.
    const element = audioRef.current;
    const sounding =
      snippetRef.current.position() ??
      (element && !element.paused && element.currentTime > 0
        ? element.currentTime
        : null);

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // From the buffer the snippets played: no fetch, and on iOS no switch from
    // Web Audio to a media element halfway through the moment.
    const player = snippetRef.current;
    fullSongPositionRef.current = null;
    if (
      player.isReady &&
      player.playFull(sounding ?? undefined, {
        continuing: sounding !== null,
      })
    ) {
      revealPlayedForRef.current = previewUrl;
      holdAudioSession();
      fullSongOnBufferRef.current = true;
      setIsFullSongPlaying(true);
      setTimeout(() => setIsPlaying(false), 0);
      return;
    }

    const fullAudio = fullAudioRef.current;
    if (fullAudio) {
      fullAudio.volume = volumeRef.current;

      const start = () => {
        revealPlayedForRef.current = previewUrl;
        fullAudio.currentTime = 0;
        void fullAudio.play().catch(() => {
          /* Autoplay block on game-over auto-play — user can tap manually */
        });
      };

      // Mounted in the commit that ends the round, so its src has not loaded.
      // Playing an empty element is undone when the source arrives.
      if (fullAudio.readyState >= HAVE_CURRENT_DATA) {
        start();
      } else {
        fullAudio.addEventListener('canplay', start, { once: true });
        // Not preloaded, since the buffer usually plays the reveal instead.
        fullAudio.load();
        cleanupReveal = () => fullAudio.removeEventListener('canplay', start);
      }
    }

    setTimeout(() => setIsPlaying(false), 0);
    return () => cleanupReveal?.();
  }, [isGameOver, previewUrl]);

  const getAudioReport = useCallback(
    (): GuessAudioDto => ({
      played: playedPathRef.current !== null,
      path: playedPathRef.current ?? undefined,
      contextState: peekAudioContextState() ?? undefined,
      sessionHeld: isAudioSessionHeld(),
      userAgent: navigator.userAgent,
    }),
    [],
  );

  return {
    /** The link the audio is using, which a re-signed one does not replace. */
    previewUrl,
    audioRef,
    fullAudioRef,
    /** 0–1 through the current snippet, for the progress bar. */
    snippetProgress: snippet.progress,
    /** Peaks of the decoded track, for the waveform. */
    snippetPeaks: snippet.peaks,
    isPlaying,
    isFullSongPlaying,
    playSnippet,
    pauseSnippet,
    toggleFullSong,
    stopFullSong,
    /** What the device was doing, sent with each guess for CAR-253's audit. */
    getAudioReport,
  };
}
