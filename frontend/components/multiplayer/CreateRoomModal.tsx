'use client';

import { useCreateRoom } from '@/hooks/multiplayer/useCreateRoom';
import type { CreateRoomControllerDtoRoundCountEnum } from '@/sdk';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Music, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
}

const ROUND_OPTIONS: {
  value: CreateRoomControllerDtoRoundCountEnum;
  label: string;
  description: string;
}[] = [
  { value: 3, label: '3', description: 'Quick' },
  { value: 5, label: '5', description: 'Classic' },
  { value: 10, label: '10', description: 'Marathon' },
];

export function CreateRoomModal({ open, onClose }: CreateRoomModalProps) {
  const [roundCount, setRoundCount] =
    useState<CreateRoomControllerDtoRoundCountEnum>(5);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const createRoom = useCreateRoom();
  const modalId = useId();
  const titleId = `${modalId}-title`;

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const handleCreate = useCallback(() => {
    if (createRoom.isPending) return;
    createRoom.mutate(roundCount, {
      onSuccess: (data) => {
        router.push(`/multiplayer/${data.id}`);
        onClose();
      },
    });
  }, [roundCount, createRoom, router, onClose]);

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            className="absolute inset-0 bg-black/85"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-2xl outline-none"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual Flare - Unified to match Join Modal but Purple */}
            <div
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none opacity-40"
              style={{
                background:
                  'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
              }}
            />

            <div className="relative p-6 sm:p-10">
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-5 right-5 p-2 rounded-full text-fg/40 hover:text-fg hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h2
                    id={titleId}
                    className="text-2xl font-black text-fg tracking-tight"
                  >
                    Create Room
                  </h2>
                  <p className="text-sm text-fg/50 font-medium">
                    Configure your session.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div
                  role="radiogroup"
                  aria-labelledby="rounds-label"
                  className="space-y-4"
                >
                  <label
                    id="rounds-label"
                    className="flex items-center gap-2 text-sm font-bold text-fg/60 uppercase tracking-wider"
                  >
                    <Music className="w-4 h-4" />
                    Rounds
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {ROUND_OPTIONS.map((option) => {
                      const isSelected = roundCount === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setRoundCount(option.value)}
                          className={`flex flex-col items-center gap-1 rounded-2xl border py-4 transition-[background-color,border-color,transform] active:scale-95 ${
                            isSelected
                              ? 'border-purple-500/50 bg-purple-500/10 text-fg'
                              : 'border-white/5 bg-white/5 text-fg/40 hover:border-white/10'
                          }`}
                        >
                          <span className="text-2xl font-black font-mono">
                            {option.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-tighter ${isSelected ? 'text-purple-400' : 'text-fg/20'}`}
                          >
                            {option.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {createRoom.isError && (
                      <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-red-400 text-center font-bold"
                      >
                        {createRoom.error.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleCreate}
                    disabled={createRoom.isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-500 px-6 py-5 text-base font-black text-white hover:bg-purple-400 active:scale-[0.98] disabled:opacity-20 transition-[background-color,transform,opacity] shadow-[0_8px_25px_rgba(168,85,247,0.25)]"
                  >
                    {createRoom.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-5 h-5 fill-current" />
                        <span>Start Game</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
