import Link from 'next/link';
import { listPlatformApplications, listPlatformSchools } from '@/server/platform/service';
import { StatusBadge } from '@/components/tenant';
import { PlatformChrome } from '@/components/platform';
import { requireAuthenticatedUser } from '@/server/auth/profile';

export const dynamic = 'force-dynamic';

export default async function PlatformDashboardPage() {
  const account = await requireAuthenticatedUser();
  const getAccount = () => Promise.resolve(account);
  const [applications, schools, submitted, review] = await Promise.all([
    listPlatformApplications({ page: 1, pageSize: 6, getAccount }),
    listPlatformSchools({ page: 1, pageSize: 6, getAccount }),
    listPlatformApplications({ status: 'SUBMITTED', page: 1, pageSize: 1, getAccount }),
    listPlatformApplications({ status: 'UNDER_REVIEW', page: 1, pageSize: 1, getAccount }),
  ]);
  return <PlatformChrome active='overview'><header className='platform-header'><div><p className='eyebrow'>Platform administration</p><h1>Good morning, admin.</h1><p>Keep applications moving and your school network healthy.</p></div><div className='platform-live'><i /> System operational</div></header>
      <section className='platform-kpis'><Link href={'/platform/applications' as never}><span>All applications</span><strong>{applications.total}</strong><small>View pipeline →</small></Link><Link href={'/platform/applications?status=SUBMITTED' as never}><span>Awaiting review</span><strong>{submitted.total}</strong><small>Needs attention →</small></Link><Link href={'/platform/applications?status=UNDER_REVIEW' as never}><span>In review</span><strong>{review.total}</strong><small>Continue reviewing →</small></Link><Link href={'/platform/schools' as never}><span>Provisioned schools</span><strong>{schools.total}</strong><small>Manage network →</small></Link></section>
      <div className='platform-columns'><section className='platform-panel'><div className='platform-panel-heading'><div><p className='eyebrow'>Latest activity</p><h2>Application pipeline</h2></div><Link href={'/platform/applications' as never}>View all →</Link></div>{applications.items.length ? <div className='platform-list'>{applications.items.map(application => <Link className='platform-list-row' key={application.id} href={`/platform/applications/${application.id}` as never}><div className='platform-avatar'>{application.schoolName.slice(0, 1).toUpperCase()}</div><div><strong>{application.schoolName}</strong><small>{application.applicant.firstName} {application.applicant.lastName} · {application.applicant.email}</small></div><StatusBadge status={application.status}/><span className='row-arrow'>→</span></Link>)}</div> : <p className='platform-empty'>No applications yet.</p>}</section><section className='platform-panel'><div className='platform-panel-heading'><div><p className='eyebrow'>Tenant network</p><h2>Recent schools</h2></div><Link href={'/platform/schools' as never}>View all →</Link></div>{schools.items.length ? <div className='platform-list'>{schools.items.map(school => <Link className='platform-list-row' key={school.id} href={`/platform/schools/${school.id}` as never}><div className='platform-avatar school-avatar'>S</div><div><strong>{school.name}</strong><small>{school.slug} · {school.countryCode}</small></div><StatusBadge status={school.status}/><span className='row-arrow'>→</span></Link>)}</div> : <p className='platform-empty'>No schools provisioned yet.</p>}</section></div>
    </PlatformChrome>;
}
