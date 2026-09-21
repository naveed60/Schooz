import Link from 'next/link';
import { registerAction } from '@/server/auth/actions';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className='shell'>
      <h1>Create account</h1>
      {params.error && (
        <p role='alert'>
          Unable to create your account. Check your details and try again.
        </p>
      )}
      <form action={registerAction}>
        <label htmlFor='firstName'>First name</label>
        <input
          id='firstName'
          name='firstName'
          autoComplete='given-name'
          required
        />
        <label htmlFor='lastName'>Last name</label>
        <input
          id='lastName'
          name='lastName'
          autoComplete='family-name'
          required
        />
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
          autoComplete='new-password'
          minLength={8}
          required
        />
        <button type='submit'>Create account</button>
      </form>
      <p>
        <Link href='/login'>Already have an account?</Link>
      </p>
    </main>
  );
}
