import { redirect } from 'next/navigation';
import { ADMIN_SECTIONS } from './sections';

// The first section, rather than a third page to keep in step with the others.
export default function AdminPage() {
  redirect(ADMIN_SECTIONS[0].href);
}
