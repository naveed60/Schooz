import Link from 'next/link';
import { listPlatformSchools } from '@/server/platform/service';

export default async function PlatformSchoolsPage({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const result = await listPlatformSchools({ page: Number(params.page) || 1 });
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return (
    <main className='shell'>
      <h1>Schools</h1>
      <p><Link href={'/platform' as never}>Platform home</Link> · <Link href={'/platform/applications' as never}>Applications</Link></p>
      {result.items.length === 0 ? <p>No schools provisioned.</p> : <ul>{result.items.map(school => <li key={school.id}><Link href={`/platform/schools/${school.id}` as never}>{school.name}</Link> — {school.status} — {school.slug}</li>)}</ul>}
      <p>Page {result.page} of {pages}</p>
      {result.page > 1 && <Link href={`/platform/schools?page=${result.page - 1}` as never}>Previous</Link>}
      {result.page < pages && <Link href={`/platform/schools?page=${result.page + 1}` as never}>Next</Link>}
    </main>
  );
}
