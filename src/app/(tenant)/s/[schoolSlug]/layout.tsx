import { forbidden, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  AuthorizationError,
  resolveSchoolContextCached,
} from '@/server/authorization';

export const dynamic = 'force-dynamic';

export default async function TenantLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}>) {
  const { schoolSlug } = await params;

  let context;
  try {
    context = await resolveSchoolContextCached(schoolSlug);
  } catch (error) {
    if (
      error instanceof AuthorizationError &&
      error.code === 'UNAUTHENTICATED'
    ) {
      redirect(`/login?next=${encodeURIComponent(`/s/${schoolSlug}`)}`);
    }
    forbidden();
  }

  return (
    <div className='tenant-shell'>
      <aside className='tenant-sidebar'>
        <Link className='brand' href={'/' as never}><span className='brand-mark'>S</span><span>Schooz</span></Link>
        <div className='tenant-school-identity'>
          <strong>{context.schoolName ?? schoolSlug}</strong>
          <span>{context.role.replaceAll('_', ' ')}</span>
        </div>
        <nav className='tenant-nav' aria-label='School navigation'>
          <Link href={`/s/${schoolSlug}/dashboard` as never}>Dashboard</Link>
          <Link href={`/s/${schoolSlug}/academics` as never}>Academics</Link>
          <Link href={`/s/${schoolSlug}/students` as never}>Students</Link>
          <Link href={`/s/${schoolSlug}/settings` as never}>School settings</Link>
        </nav>
      </aside>
      <main className='tenant-main'>{children}</main>
    </div>
  );
}
