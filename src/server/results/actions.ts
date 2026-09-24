'use server';
import { redirect } from 'next/navigation';
import { contextForSchoolSlug } from '../settings/service';
import { publishClassResults, saveClassMarks } from './service';

const value = (form: FormData, key: string) => { const item = form.get(key); return typeof item === 'string' ? item : ''; };
const fail = (slug: string, examId: string, classId: string): never => redirect(`/s/${slug}/exams/${examId}/results/${classId}?error=action-failed` as never);

export async function saveClassMarksAction(form: FormData) {
  const slug = value(form, 'schoolSlug'); const examId = value(form, 'examId'); const classId = value(form, 'classId');
  try { const context = await contextForSchoolSlug(slug); await saveClassMarks(context, { examId, classId, subjectId: value(form, 'subjectId'), status: value(form, 'status') || 'DRAFT', entries: JSON.parse(value(form, 'entries')) }); } catch { fail(slug, examId, classId); }
  redirect(`/s/${slug}/exams/${examId}/results/${classId}?message=saved` as never);
}

export async function publishClassResultsAction(form: FormData) {
  const slug = value(form, 'schoolSlug'); const examId = value(form, 'examId'); const classId = value(form, 'classId');
  try { const context = await contextForSchoolSlug(slug); await publishClassResults(context, { examId, classId }); } catch { fail(slug, examId, classId); }
  redirect(`/s/${slug}/exams/${examId}/results/${classId}?message=published` as never);
}
