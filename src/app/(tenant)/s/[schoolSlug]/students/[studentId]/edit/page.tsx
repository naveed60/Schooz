import { resolveSchoolContextCached } from '@/server/authorization';
import { getStudentBounded } from '@/server/students/service';
import { updateStudentAction } from '@/server/students/actions';
export default async function EditStudent({ params }: { params: Promise<{ schoolSlug: string; studentId: string }> }) {
  const { schoolSlug, studentId } = await params;
  const context = await resolveSchoolContextCached(schoolSlug);
  const student = await getStudentBounded(context, studentId);
  if (!context.permissions.includes('students:manage')) return <p>Not authorized.</p>;
  const date = (value: Date | null) => value ? value.toISOString().slice(0, 10) : '';
  return <main><h1>Edit student</h1><form action={updateStudentAction} className='auth-form'>
    <input type='hidden' name='schoolSlug' value={schoolSlug}/><input type='hidden' name='studentId' value={student.id}/>
    <input name='firstName' defaultValue={student.firstName} required/><input name='middleName' defaultValue={student.middleName ?? ''}/><input name='lastName' defaultValue={student.lastName} required/>
    <input name='preferredName' defaultValue={student.preferredName ?? ''}/><input name='gender' defaultValue={student.gender ?? ''}/><input name='dateOfBirth' type='date' defaultValue={date(student.dateOfBirth)} required/>
    <input name='admissionDate' type='date' defaultValue={date(student.admissionDate)} required/><input name='email' type='email' defaultValue={student.email ?? ''}/><input name='phone' defaultValue={student.phone ?? ''}/><input name='bloodGroup' defaultValue={student.bloodGroup ?? ''}/>
    <button type='submit'>Save student</button></form></main>;
}
