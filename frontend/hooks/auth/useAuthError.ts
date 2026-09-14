'use client';

import { useState, useEffect } from 'react';
import { authErrorMessage } from '@/lib/auth-errors';

/**
 * Hook to handle URL-based error parameters and error state
 * Parses ?error= query parameter and cleans up the URL
 */
export function useAuthError() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- One-time initialization from URL parameter
      setError(authErrorMessage(urlError));
      window.history.replaceState({}, '', '/');
    }
  }, []);

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    clearError,
  };
}
