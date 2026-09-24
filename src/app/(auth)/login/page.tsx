import Link from 'next/link';
import { loginAction } from '@/server/auth/actions';
import { AuthSubmitButton } from '@/components/auth/submit-button';

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
  const error = params.error === 'unverified'
    ? 'Please confirm your email address before signing in.'
    : params.error === 'callback'
      ? 'That confirmation link is invalid or expired. Request a new one and try again.'
      : params.error === 'invalid'
        ? 'We couldn’t sign you in. Check your email and password, then try again.'
        : params.error === 'already-registered'
          ? 'This email already has an account. Sign in or use Forgot password to regain access.'
        : null;

  return (
    <main className='auth-page'>
      <div className='auth-aside'>
        <Link className='brand brand-light' href='/'><span className='brand-mark'>S</span><span>Schooz</span></Link>
        <div><p className='eyebrow'>Welcome back</p><h1>Your school,<br /><em>in rhythm.</em></h1><p>Pick up where your team left off.</p></div>
        <span className='aside-foot'>© 2026 Schooz</span>
      </div>
      <div className='auth-content'>
        <div className='auth-form-wrap'>
          <Link className='mobile-brand brand' href='/'><span className='brand-mark'>S</span><span>Schooz</span></Link>
          <p className='eyebrow'>School access</p>
          <h2>Sign in to your workspace</h2>
          <p className='form-intro'>Use your school email to continue.</p>
          {message && <p className='form-message' role='status'>{message}</p>}
          {error && <p className='form-error' role='alert'>{error}</p>}
          <form className='auth-form' action={loginAction}>
            <input type='hidden' name='next' value={params.next ?? '/'} />
            <label htmlFor='email'>School email</label>
            <input id='email' name='email' type='email' autoComplete='email' placeholder='you@school.edu' required />
            <div className='label-row'><label htmlFor='password'>Password</label><Link href='/forgot-password'>Forgot password?</Link></div>
            <input id='password' name='password' type='password' autoComplete='current-password' placeholder='Enter your password' required />
            <AuthSubmitButton idleLabel='Sign in' pendingLabel='Signing in…' />
          </form>
          <p className='form-switch'>New to Schooz? <Link href='/register'>Create a school account</Link></p>
        </div>
      </div>
    </main>
  );
}
