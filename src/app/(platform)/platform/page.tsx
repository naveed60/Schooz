import { logoutAction } from '@/server/auth/actions';

export const dynamic = 'force-dynamic';

export default async function PlatformPlaceholderPage() {
  return (
    <main className='shell'>
      <h1>Platform</h1>
      <form action={logoutAction}>
        <button type='submit'>Sign out</button>
      </form>
      <p>Platform administration will be added in a later module.</p>
    </main>
  );
}
