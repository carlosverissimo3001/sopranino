import type { Metadata } from 'next';
import { PrivacyPage } from '@/components/privacy/PrivacyPage';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What Sopranino keeps about you, why, who else is involved, and how to have it deleted.',
};

export default function Page() {
  return <PrivacyPage />;
}
