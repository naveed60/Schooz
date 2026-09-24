import Link from 'next/link';
import { listPlatformSchools } from '@/server/platform/service';
import { PlatformBreadcrumb, PlatformChrome } from '@/components/platform';
import { StatusBadge } from '@/components/tenant';

export default async function PlatformSchoolsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const result = await listPlatformSchools({ page: Number(params.page) || 1 });
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));
  return <PlatformChrome active='schools'><PlatformBreadcrumb current='Schools' /><header className='platform-page-header'><div><p className='eyebrow'>Tenant network</p><h1>Schools</h1><p>Manage every provisioned school in your Schooz network.</p></div><div className='platform-count'>{result.total}<small>Active tenants</small></div></header><section className='platform-panel platform-table-panel'>{result.items.length ? <div className='platform-table-wrap'><table className='platform-table'><thead><tr><th>School</th><th>Location</th><th>Contact</th><th>Status</th><th /></tr></thead><tbody>{result.items.map(school => <tr key={school.id}><td><Link className='platform-table-primary' href={`/platform/schools/${school.id}` as never}>{school.name}</Link><span>{school.slug}</span></td><td>{school.city}, {school.countryCode}</td><td>{school.email}<span>{school.phone}</span></td><td><StatusBadge status={school.status} /></td><td><Link className='row-arrow' href={`/platform/schools/${school.id}` as never}>→</Link></td></tr>)}</tbody></table></div> : <div className='platform-empty-state'><strong>No schools provisioned</strong><span>Approved applications will appear here.</span></div>}<div className='platform-pagination'><span>Page {result.page} of {pages}</span><div>{result.page > 1 && <Link href={`/platform/schools?page=${result.page - 1}` as never}>← Previous</Link>}{result.page < pages && <Link href={`/platform/schools?page=${result.page + 1}` as never}>Next →</Link>}</div></div></section></PlatformChrome>;
}
