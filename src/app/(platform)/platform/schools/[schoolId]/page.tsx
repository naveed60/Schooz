import { notFound } from 'next/navigation';
import Link from 'next/link';
import { reactivateSchoolAction, suspendSchoolAction } from '@/server/platform/actions';
import { getPlatformSchool } from '@/server/platform/service';

export default async function PlatformSchoolDetailPage({
  params,
}: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  let school;
  try { school = await getPlatformSchool(schoolId); } catch { notFound(); }
  if (!school) notFound();
  return (
    <main className='shell'>
      <p><Link href={'/platform/schools' as never}>← Schools</Link></p>
      <h1>{school.name}</h1>
      <p>Status: <strong>{school.status}</strong></p>
      <p>Slug: {school.slug}</p>
      <p>Contact: {school.email} · {school.phone}</p>
      <p>Address: {school.addressLine1}, {school.city}, {school.stateOrRegion}, {school.countryCode}</p>
      {school.status === 'ACTIVE' && <form action={suspendSchoolAction}><input type='hidden' name='schoolId' value={school.id} /><button type='submit'>Suspend school</button></form>}
      {school.status === 'SUSPENDED' && <form action={reactivateSchoolAction}><input type='hidden' name='schoolId' value={school.id} /><button type='submit'>Reactivate school</button></form>}
    </main>
  );
}
