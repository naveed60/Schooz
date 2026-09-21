import Link from 'next/link';

export default function HomePage() {
  return (
    <main className='landing-page'>
      <nav className='site-nav' aria-label='Main navigation'>
        <Link className='brand' href='/' aria-label='Schooz home'>
          <span className='brand-mark'>S</span>
          <span>Schooz</span>
        </Link>
        <div className='nav-actions'>
          <Link className='nav-link' href='/login'>Sign in</Link>
          <Link className='button button-small' href='/register'>Get started</Link>
        </div>
      </nav>

      <section className='hero'>
        <div className='hero-copy'>
          <p className='eyebrow'>The school operations desk</p>
          <h1>Make room for the work that matters.</h1>
          <p className='lede'>
            Schooz brings your school&apos;s daily rhythm into one calm, connected
            workspace, so every team can move with confidence.
          </p>
          <div className='hero-actions'>
            <Link className='button' href='/register'>Create your school account <span aria-hidden='true'>↗</span></Link>
            <Link className='text-link' href='/login'>Already have access? Sign in <span aria-hidden='true'>→</span></Link>
          </div>
        </div>
        <div className='hero-visual' aria-label='Schooz school operations overview'>
          <div className='visual-topline'><span>Tuesday · October 08</span><span className='live-dot'>Live</span></div>
          <div className='visual-title'>Good morning, Cedar House.</div>
          <div className='visual-grid'>
            <div className='visual-card visual-card-large'>
              <span className='card-label'>Today&apos;s attendance</span>
              <strong>94.8<span>%</span></strong>
              <div className='bar'><i /></div>
              <small>+2.4% from last Tuesday</small>
            </div>
            <div className='visual-card visual-card-note'>
              <span className='card-label'>Next up</span>
              <strong>Staff check-in</strong>
              <small>09:30 · Main office</small>
              <span className='arrow-badge'>→</span>
            </div>
          </div>
          <div className='visual-footer'><span className='avatar-stack'><i>A</i><i>M</i><i>+</i></span><span>8 teammates are online</span></div>
        </div>
      </section>

      <section className='principles' aria-label='Schooz principles'>
        <div><span className='principle-number'>01</span><strong>One shared picture</strong><p>Keep your people, places, and priorities in sync.</p></div>
        <div><span className='principle-number'>02</span><strong>Built for schools</strong><p>Thoughtful workflows for the details of campus life.</p></div>
        <div><span className='principle-number'>03</span><strong>Ready when you are</strong><p>Start with your school and grow at your own pace.</p></div>
      </section>
    </main>
  );
}
