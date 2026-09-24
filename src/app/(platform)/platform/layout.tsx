import { forbidden, redirect } from 'next/navigation';
import { requireAuthenticatedClaimsUser } from '@/server/auth/profile';
import {
  AuthorizationError,
  requirePlatformAdmin,
} from '@/server/authorization';

export const dynamic = 'force-dynamic';

export default async function PlatformLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requirePlatformAdmin(requireAuthenticatedClaimsUser);
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
