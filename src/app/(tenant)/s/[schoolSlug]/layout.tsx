import { forbidden, redirect } from 'next/navigation';
import {
  AuthorizationError,
  resolveSchoolContext,
} from '@/server/authorization';

export const dynamic = 'force-dynamic';

export default async function TenantLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}>) {
  const { schoolSlug } = await params;

  try {
    await resolveSchoolContext({ slug: schoolSlug });
  } catch (error) {
    if (
      error instanceof AuthorizationError &&
      error.code === 'UNAUTHENTICATED'
    ) {
      redirect(`/login?next=${encodeURIComponent(`/s/${schoolSlug}`)}`);
    }
    forbidden();
  }

  return children;
}
