'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAudioContext } from '@/lib/audio-context';
import {
  audioDebugEnabled,
  getAudioLog,
  subscribeAudioLog,
} from '@/lib/audio-debug';

const noSubscribe = () => () => {};

/** Only with ?debug=audio, and only to read a phone that has no console. */
export function AudioDebugPanel() {
  // Read after hydration: the server has no query string to answer from.
  const enabled = useSyncExternalStore(
    noSubscribe,
    audioDebugEnabled,
    () => false,
  );
  const [, bump] = useState(0);
  const [live, setLive] = useState('');

  useEffect(() => {
    if (!audioDebugEnabled()) return;

    const unsubscribe = subscribeAudioLog(() => bump((n) => n + 1));
    const timer = setInterval(() => {
      const ctx = getAudioContext();
      setLive(
        ctx
          ? `state=${ctx.state} clock=${ctx.currentTime.toFixed(2)} rate=${ctx.sampleRate}`
          : 'no context',
      );
    }, 250);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9999] max-h-[45vh] overflow-auto bg-black/90 p-2 font-mono text-[10px] leading-tight text-green-300"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="mb-1 text-yellow-300">{live}</div>
      {getAudioLog().map((line, i) => (
        <div key={`${i}-${line}`}>{line}</div>
      ))}
    </div>
  );
}
