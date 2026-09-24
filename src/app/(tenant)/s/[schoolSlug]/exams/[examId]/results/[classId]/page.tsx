import Link from 'next/link';
import { getClassResults } from '@/server/results/service';
import { publishClassResultsAction, saveClassMarksAction } from '@/server/results/actions';
import { contextForSchoolSlug } from '@/server/settings/service';

export default async function ClassResultsPage({ params }: { params: Promise<{ schoolSlug: string; examId: string; classId: string }> }) {
  const { schoolSlug, examId, classId } = await params;
  const context = await contextForSchoolSlug(schoolSlug);
  const results = await getClassResults(context, { examId, classId });
  const subjects = [...new Set(results.flatMap((result) => result.subjects.map((subject) => subject.subjectId)))];
  const subjectId = subjects[0];
  const entries = results.flatMap((result) => result.subjects.filter((subject) => subject.subjectId === subjectId).map(() => ({ studentId: '', enrollmentId: '', marksObtained: null })));
  return <main><p><Link href={`/s/${schoolSlug}/exams/${examId}` as never}>Back to exam</Link></p><h1>Class results</h1><p>Results are calculated from raw marks. Bulk entry submits one request for a subject.</p><form action={saveClassMarksAction}><input type="hidden" name="schoolSlug" value={schoolSlug} /><input type="hidden" name="examId" value={examId} /><input type="hidden" name="classId" value={classId} /><input type="hidden" name="subjectId" value={subjectId ?? ''} /><input type="hidden" name="status" value="DRAFT" /><label>Bulk entries JSON<textarea name="entries" defaultValue={JSON.stringify(entries)} /></label><button type="submit">Save marks</button></form><form action={publishClassResultsAction}><input type="hidden" name="schoolSlug" value={schoolSlug} /><input type="hidden" name="examId" value={examId} /><input type="hidden" name="classId" value={classId} /><button type="submit">Publish class results</button></form><table><thead><tr><th>Student</th><th>Total</th><th>Percentage</th><th>Status</th></tr></thead><tbody>{results.map((result, index) => <tr key={index}><td>{result.subjects[0]?.subjectName ? `Student ${index + 1}` : `Student ${index + 1}`}</td><td>{result.totalObtained}/{result.totalPossible}</td><td>{result.percentage ?? 'Incomplete'}</td><td>{result.status}</td></tr>)}</tbody></table></main>;
}
