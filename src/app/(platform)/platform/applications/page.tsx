import Link from 'next/link';
import { listPlatformApplications } from '@/server/platform/service';

const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'] as const;

export default async function PlatformApplicationsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number]) ? params.status as (typeof statuses)[number] : undefined;
  const result = await listPlatformApplications({ status, page: Number(params.page) || 1 });
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return (
    <main className='shell'>
      <h1>School applications</h1>
      <p><Link href={'/platform' as never}>Platform home</Link> · <Link href={'/platform/schools' as never}>Schools</Link></p>
      <nav>{statuses.map(option => <Link key={option} href={`/platform/applications?status=${option}` as never}>{option}</Link>)}</nav>
      {result.items.length === 0 ? <p>No applications found.</p> : <ul>{result.items.map(application => (
        <li key={application.id}>
          <Link href={`/platform/applications/${application.id}` as never}>{application.schoolName}</Link> — {application.status} — {application.applicant.email}
        </li>
      ))}</ul>}
      <p>Page {result.page} of {pages}</p>
      {result.page > 1 && <Link href={`/platform/applications?${status ? `status=${status}&` : ''}page=${result.page - 1}` as never}>Previous</Link>}
      {result.page < pages && <Link href={`/platform/applications?${status ? `status=${status}&` : ''}page=${result.page + 1}` as never}>Next</Link>}
    </main>
  );
}
