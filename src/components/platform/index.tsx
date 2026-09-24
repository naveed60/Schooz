import Link from 'next/link';
import { requireAuthenticatedUser } from '@/server/auth/profile';
import { logoutAction } from '@/server/auth/actions';

type PlatformSection = 'overview' | 'applications' | 'schools' | 'profile';

export async function PlatformChrome({ active, children }: Readonly<{ active: PlatformSection; children: React.ReactNode }>) {
  const { profile } = await requireAuthenticatedUser();
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Platform admin';
  const initials = `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || 'A';
  return <div className='platform-shell'><aside className='platform-sidebar'><Link className='brand brand-light' href={'/platform' as never}><span className='brand-mark'>S</span><span>Schooz</span></Link><div className='platform-label'>Platform console</div><nav className='platform-nav' aria-label='Platform navigation'><Link className={active === 'overview' ? 'active' : ''} href={'/platform' as never}>Overview</Link><Link className={active === 'applications' ? 'active' : ''} href={'/platform/applications' as never}>Applications</Link><Link className={active === 'schools' ? 'active' : ''} href={'/platform/schools' as never}>Schools</Link></nav><div className='platform-sidebar-spacer' /><Link className={`platform-profile-link ${active === 'profile' ? 'active' : ''}`} href={'/platform/profile' as never}><span className='platform-profile-avatar'>{initials}</span><span><strong>{displayName}</strong><small>Platform admin</small></span><span className='row-arrow'>→</span></Link><form className='platform-signout' action={logoutAction}><button type='submit'>Sign out <span>↗</span></button></form></aside><main className='platform-main'>{children}</main></div>;
}

export function PlatformBreadcrumb({ current }: { current: string }) {
  return <div className='platform-breadcrumb'><Link href={'/platform' as never}>Platform admin</Link><span>/</span><span>{current}</span></div>;
}
