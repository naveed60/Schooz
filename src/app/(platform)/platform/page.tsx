import { redirect } from 'next/navigation';
import { logoutAction } from '@/server/auth/actions';
import { requireAuthenticatedUser } from '@/server/auth/profile';

export const dynamic = 'force-dynamic';

export default async function PlatformPlaceholderPage() {
  let account;
  try {
    account = await requireAuthenticatedUser();
  } catch {
    redirect('/login?next=/platform');
  }

  return (
    <main className='shell'>
      <h1>Platform</h1>
      <p>Signed in as {account?.profile.email}.</p>
      <form action={logoutAction}>
        <button type='submit'>Sign out</button>
      </form>
      <p>Platform administration will be added in a later module.</p>
    </main>
  );
}
