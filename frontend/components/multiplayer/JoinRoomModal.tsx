'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useJoinRoom } from '@/hooks/multiplayer/useJoinRoom';

interface JoinRoomModalProps {
  open: boolean;
  onClose: () => void;
}

/** Pasting the whole invite link should work as well as typing the code. */
function extractCodeFromInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const joinPathPattern = /(?:^|\/+)multiplayer\/join\/([^/?#\s]+)/i;
  const pathMatch = trimmed.match(joinPathPattern);
  const candidate = pathMatch?.[1] ?? trimmed;

  return candidate
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
}

/** Own component so a keystroke re-renders this, not the animated shell. */
function JoinRoomForm({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const router = useRouter();
  const joinRoom = useJoinRoom();

  const handleSubmit = useCallback(() => {
    if (!code || joinRoom.isPending) return;
    joinRoom.mutate(code, {
      onSuccess: (data) => {
        router.push(`/multiplayer/${data.id}`);
        onClose();
      },
    });
  }, [code, joinRoom, router, onClose]);

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="room-code-input" className="sr-only">
          Invite Code
        </label>
        <input
          id="room-code-input"
          type="text"
          value={code}
          onChange={(e) => setCode(extractCodeFromInput(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="CODE123"
          maxLength={8}
          autoFocus
          autoComplete="off"
          spellCheck="false"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-4xl font-mono font-black tracking-[0.3em] text-fg placeholder:text-white/5 focus:border-spotify-green/50 focus:outline-none transition-colors uppercase shadow-inner"
        />
      </div>

      <AnimatePresence mode="wait">
        {joinRoom.isError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-400 text-center font-bold"
          >
            {joinRoom.error.message}
          </motion.p>
        )}
      </AnimatePresence>

      <Link
        href="/multiplayer/join"
        onClick={onClose}
        className="group flex items-center justify-center gap-1.5 text-sm font-bold text-fg/40 hover:text-spotify-green transition-colors"
      >
        Browse open rooms
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      <button
        onClick={handleSubmit}
        disabled={code.length !== 8 || joinRoom.isPending}
        className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-spotify-green px-6 py-5 text-base font-black text-black hover:bg-spotify-green/90 active:scale-[0.98] disabled:opacity-20 disabled:pointer-events-none transition-[background-color,transform,opacity] shadow-[0_8px_20px_rgba(30,215,96,0.2)]"
      >
        {joinRoom.isPending ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <span>Join Game</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}

export function JoinRoomModal({ open, onClose }: JoinRoomModalProps) {
  const [mounted, setMounted] = useState(false);

  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;

  // Prevent hydration mismatch and handle mounting cleanly without cascading renders
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  // Define the modal JSX
  const modalContent = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <motion.div
            className="absolute inset-0 bg-black/85"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{
                background:
                  'radial-gradient(circle, rgba(30,215,96,0.2) 0%, transparent 70%)',
              }}
            />

            <div className="relative p-6 sm:p-10">
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-5 right-5 p-2 rounded-full text-fg/40 hover:text-fg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-spotify-green focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-2xl bg-spotify-green/10 border border-spotify-green/20"
                  aria-hidden="true"
                >
                  <Users className="w-6 h-6 text-spotify-green" />
                </div>
                <div>
                  <h2
                    id={titleId}
                    className="text-2xl font-black text-fg tracking-tight"
                  >
                    Join Room
                  </h2>
                  <p
                    id={descriptionId}
                    className="text-sm text-fg/50 font-medium"
                  >
                    Enter the invite code to join.
                  </p>
                </div>
              </div>

              <JoinRoomForm onClose={onClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
