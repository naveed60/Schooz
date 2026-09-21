import Link from 'next/link';
import { forgotPasswordAction } from '@/server/auth/actions';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className='shell'>
      <h1>Reset password</h1>
      <p>
        {params.message === 'reset-sent'
          ? 'If an account matches, a reset email has been sent.'
          : 'Enter your email to request a reset link.'}
      </p>
      <form action={forgotPasswordAction}>
        <label htmlFor='email'>Email</label>
        <input
          id='email'
          name='email'
          type='email'
          autoComplete='email'
          required
        />
        <button type='submit'>Send reset link</button>
      </form>
      <p>
        <Link href='/login'>Back to sign in</Link>
      </p>
    </main>
  );
}
