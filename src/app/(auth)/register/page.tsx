import Link from 'next/link';
import { registerAction } from '@/server/auth/actions';
import { AuthSubmitButton } from '@/components/auth/submit-button';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className='auth-page'>
      <div className='auth-aside'><Link className='brand brand-light' href='/'><span className='brand-mark'>S</span><span>Schooz</span></Link><div><p className='eyebrow'>Start together</p><h1>A better day<br /><em>starts here.</em></h1><p>Set up your school&apos;s calm command center.</p></div><span className='aside-foot'>© 2026 Schooz</span></div>
      <div className='auth-content'>
        <div className='auth-form-wrap register-wrap'>
          <Link className='mobile-brand brand' href='/'><span className='brand-mark'>S</span><span>Schooz</span></Link>
          <p className='eyebrow'>School access</p>
          <h2>Create your account</h2>
          <p className='form-intro'>Bring your team into one clear workspace.</p>
          {params.error && <p className='form-error' role='alert'>We couldn’t create your account. Check that all fields are valid and that this email is not already registered.</p>}
          <form className='auth-form' action={registerAction}>
            <div className='field-grid'><div><label htmlFor='firstName'>First name</label><input id='firstName' name='firstName' autoComplete='given-name' placeholder='Avery' required /></div><div><label htmlFor='lastName'>Last name</label><input id='lastName' name='lastName' autoComplete='family-name' placeholder='Morgan' required /></div></div>
            <label htmlFor='email'>School email</label>
            <input id='email' name='email' type='email' autoComplete='email' placeholder='you@school.edu' required />
            <label htmlFor='password'>Create a password</label>
            <input id='password' name='password' type='password' autoComplete='new-password' placeholder='8 characters minimum' minLength={8} required />
            <AuthSubmitButton idleLabel='Create account' pendingLabel='Creating account…' />
          </form>
          <p className='fine-print'>By creating an account, you agree to Schooz&apos;s terms and privacy policy.</p>
          <p className='form-switch'>Already have access? <Link href='/login'>Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
