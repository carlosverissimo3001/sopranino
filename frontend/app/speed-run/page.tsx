'use client';

import { Suspense } from 'react';
import { SpeedRunPage } from '@/components/speed-run/SpeedRunPage';

// The setup reads its difficulty from the URL, which needs a boundary.
export default function SpeedRunRoute() {
  return (
    <Suspense fallback={null}>
      <SpeedRunPage />
    </Suspense>
  );
}
