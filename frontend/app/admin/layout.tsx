import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getServerUser } from '@/lib/auth-server';
import { AdminNav } from './AdminNav';

// The guard sits here so a new section cannot arrive unprotected.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerUser();

  if (!user?.isAdmin) {
    redirect('/');
  }

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="relative mb-6 flex items-center justify-center">
          <Link
            href="/"
            className="absolute left-0 flex items-center gap-2 text-sm text-fg/70 hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-xl font-semibold text-fg">Admin Area</h1>
        </div>

        <div className="mb-6 flex justify-center">
          <AdminNav />
        </div>

        <div className="rounded-xl border border-fg/10 bg-fg/5 p-4">
          {children}
        </div>
      </div>
    </main>
  );
}
