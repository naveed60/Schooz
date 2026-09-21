import { resetPasswordAction } from '@/server/auth/actions';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className='shell'>
      <h1>Choose a new password</h1>
      {params.error && (
        <p role='alert'>
          Unable to update your password. Try the reset link again.
        </p>
      )}
      <form action={resetPasswordAction}>
        <label htmlFor='password'>New password</label>
        <input
          id='password'
          name='password'
          type='password'
          autoComplete='new-password'
          minLength={8}
          required
        />
        <label htmlFor='confirmPassword'>Confirm password</label>
        <input
          id='confirmPassword'
          name='confirmPassword'
          type='password'
          autoComplete='new-password'
          minLength={8}
          required
        />
        <button type='submit'>Update password</button>
      </form>
    </main>
  );
}
