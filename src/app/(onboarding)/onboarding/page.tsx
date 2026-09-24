import Link from 'next/link';
import { createApplicationDraftAction } from '@/server/onboarding/actions';
import { listMyApplications } from '@/server/onboarding/service';

export default async function OnboardingPage() {
  const applications = await listMyApplications();
  return (
    <main className='onboarding-page'><div className='onboarding-wrap'><nav className='onboarding-nav'><Link className='brand' href='/'><span className='brand-mark'>S</span><span>Schooz</span></Link><Link className='onboarding-exit' href='/'>Exit onboarding <span>↗</span></Link></nav>
      <header className='onboarding-header'><div><p className='eyebrow'>School onboarding</p>
      <h1>Register a school</h1>
      <p className='onboarding-lede'>Tell us about your school. We&apos;ll review your details and guide you through verification before access is created.</p></div><div className='onboarding-progress'><span>01</span><i></i><span>02</span></div></header>

      <section className='onboarding-section'>
        <h2>Your applications</h2>
        {applications.length === 0 ? <p>No applications yet.</p> : applications.map(application => (
          <article key={application.id}>
            <h3>{application.schoolName}</h3>
            <p>Status: <strong>{application.status}</strong></p>
            <p>{application.documents.length} document(s)</p>
            <Link href={`/onboarding/${application.id}` as never}>Open application</Link>
          </article>
        ))}
      </section>

      <section className='onboarding-section'>
        <h2>Start an application</h2>
        <form action={createApplicationDraftAction} className='auth-form onboarding-form'><div className='onboarding-form-heading'><div><p className='eyebrow'>Step one</p><h2>School profile</h2></div><span>Save anytime</span></div><div className='onboarding-fields'>
          <input name='schoolName' placeholder='School name' required />
          <input name='legalName' placeholder='Legal name (optional)' />
          <input name='registrationNumber' placeholder='Registration number (optional)' />
          <input name='schoolType' placeholder='School type' required />
          <input name='email' type='email' placeholder='School email' required />
          <input name='phone' placeholder='Phone' required />
          <input name='website' type='url' placeholder='Website (optional)' />
          <input name='addressLine1' placeholder='Address line 1' required />
          <input name='addressLine2' placeholder='Address line 2 (optional)' />
          <input name='city' placeholder='City' required />
          <input name='stateOrRegion' placeholder='State or region' required />
          <input name='postalCode' placeholder='Postal code (optional)' />
          <input name='countryCode' placeholder='Country code, e.g. PK' maxLength={2} required />
          <input name='principalName' placeholder='Principal name (optional)' />
          </div><button className='button onboarding-submit' type='submit'>Save and continue <span>→</span></button>
        </form>
      </section>
    </div></main>
  );
}
