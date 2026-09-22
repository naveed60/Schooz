import { resolveSchoolContextCached } from '@/server/authorization';
import { PageHeader, EmptyState, StatusBadge } from '@/components/tenant';

export default async function TenantDashboardPage({
  params,
}: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params;
  const context = await resolveSchoolContextCached(schoolSlug);
  return (
    <div>
      <PageHeader eyebrow='School dashboard' title={`Welcome to ${context.schoolName ?? schoolSlug}`} description='Your school workspace is ready. Operational modules will appear here as they are enabled.' />
      <section className='dashboard-identity'>
        <div><span className='card-label'>School</span><strong>{context.schoolName ?? schoolSlug}</strong><span>{context.schoolSlug}</span></div>
        <div><span className='card-label'>Your role</span><strong>{context.role.replaceAll('_', ' ')}</strong><StatusBadge status='ACTIVE' /></div>
      </section>
      <section className='dashboard-grid' aria-label='Future module areas'>
        <EmptyState title='Students' description='Student records will be available in a future module.' />
        <EmptyState title='Academics' description='Academic structure will be available in a future module.' />
        <EmptyState title='Finance' description='Fees and payments will be available in a future module.' />
      </section>
    </div>
  );
}
