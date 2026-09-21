import Link from 'next/link';
import { loginAction } from '@/server/auth/actions';

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const message =
    params.message === 'check-email'
      ? 'Check your email to verify your account.'
      : params.message === 'signed-out'
        ? 'You have been signed out.'
        : params.message === 'password-updated'
          ? 'Your password was updated. Please sign in.'
          : null;
  const error = params.error ? 'Unable to sign in with those details.' : null;

  return (
    <main className='shell'>
      <h1>Sign in</h1>
      {message && <p role='status'>{message}</p>}
      {error && <p role='alert'>{error}</p>}
      <form action={loginAction}>
        <input type='hidden' name='next' value={params.next ?? '/platform'} />
        <label htmlFor='email'>Email</label>
        <input
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          required
        />
        <label htmlFor='password'>Password</label>
        <input
          id='password'
          name='password'
          type='password'
          autoComplete='current-password'
          required
        />
        <button type='submit'>Sign in</button>
      </form>
      <p>
        <Link href='/register'>Create an account</Link>
      </p>
      <p>
        <Link href='/forgot-password'>Forgot your password?</Link>
      </p>
    </main>
  );
}
