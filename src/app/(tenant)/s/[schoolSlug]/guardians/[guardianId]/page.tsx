import { resolveSchoolContextCached } from '@/server/authorization';
import { getGuardian } from '@/server/students/service';
export default async function GuardianDetail({ params }: { params: Promise<{ schoolSlug: string; guardianId: string }> }) {
  const { schoolSlug, guardianId } = await params;
  const context = await resolveSchoolContextCached(schoolSlug);
  const guardian = await getGuardian(context, guardianId);
  return <main><h1>{guardian.firstName} {guardian.lastName}</h1><p>{guardian.phone}</p><p>{guardian.email ?? 'No email'}</p><h2>Students</h2><ul>{guardian.students.map(link => <li key={link.id}><a href={`/s/${schoolSlug}/students/${link.student.id}`}>{link.student.admissionNumber} — {link.student.firstName} {link.student.lastName}</a></li>)}</ul></main>;
}
