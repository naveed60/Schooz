import { forbidden, redirect } from 'next/navigation';
import {
  AuthorizationError,
  requirePlatformAdmin,
} from '@/server/authorization';

export const dynamic = 'force-dynamic';

export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (
      error instanceof AuthorizationError &&
      error.code === 'UNAUTHENTICATED'
    ) {
      redirect('/login?next=/platform');
    }
    forbidden();
  }

  return children;
}
