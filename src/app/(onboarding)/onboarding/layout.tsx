import { redirect } from 'next/navigation';
import { requireAuthenticatedUser } from '@/server/auth/profile';

export const dynamic = 'force-dynamic';

export default async function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireAuthenticatedUser();
  } catch {
    redirect('/login?next=/onboarding');
  }
  return children;
}
