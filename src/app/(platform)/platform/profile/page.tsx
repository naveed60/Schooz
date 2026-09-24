import { PlatformBreadcrumb, PlatformChrome } from '@/components/platform';
import { requireAuthenticatedUser } from '@/server/auth/profile';
import { StatusBadge } from '@/components/tenant';

export default async function PlatformProfilePage() {
  const { profile, identity } = await requireAuthenticatedUser();
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Platform admin';
  const initials = `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase() || 'A';
  return <PlatformChrome active='profile'><PlatformBreadcrumb current='Admin profile' /><header className='platform-page-header'><div><p className='eyebrow'>Account settings</p><h1>Admin profile</h1><p>Your identity and access details for the Schooz platform console.</p></div></header><section className='platform-profile-hero'><div className='platform-profile-large-avatar'>{initials}</div><div><h2>{name}</h2><p>{profile.email}</p></div><StatusBadge status={profile.status} /></section><div className='platform-detail-grid'><section className='platform-panel'><p className='eyebrow'>Personal details</p><h2 className='platform-section-title'>Profile information</h2><dl className='platform-details'><dt>First name</dt><dd>{profile.firstName || '—'}</dd><dt>Last name</dt><dd>{profile.lastName || '—'}</dd><dt>Email</dt><dd>{profile.email}</dd></dl></section><section className='platform-panel'><p className='eyebrow'>Permissions</p><h2 className='platform-section-title'>Platform access</h2><dl className='platform-details'><dt>Role</dt><dd>{profile.platformRole?.replaceAll('_', ' ') ?? '—'}</dd><dt>Account status</dt><dd>{profile.status}</dd><dt>Last sign-in</dt><dd>{identity.last_sign_in_at ? new Date(identity.last_sign_in_at).toLocaleString() : 'Not available'}</dd></dl></section></div></PlatformChrome>;
}
