'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function OfflineBanner() {
  // Assume online until the browser says otherwise. A `typeof navigator`
  // guard is not enough: Node defines a partial navigator with no `onLine`,
  // so the server read `!undefined` and rendered this banner into every page.
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    setIsOffline(!navigator.onLine);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 py-2 px-4 bg-red-500/90 text-white text-sm font-medium backdrop-blur-sm"
          role="alert"
        >
          <WifiOff className="w-4 h-4" />
          You are offline
        </motion.div>
      )}
    </AnimatePresence>
  );
}
