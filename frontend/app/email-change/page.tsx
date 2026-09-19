import { Suspense } from 'react';
import { EmailChangeLink } from '@/components/profile/EmailChangeLink';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EmailChangeLink kind="confirm" />
    </Suspense>
  );
}
