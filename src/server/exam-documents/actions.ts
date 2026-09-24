'use server';
import { redirect } from 'next/navigation';
import { contextForSchoolSlug } from '../settings/service';
import { deleteExamDocument, getExamDocumentDownloadUrl, uploadExamDocument } from './service';
const v = (fd: FormData, key: string) => { const x = fd.get(key); return typeof x === 'string' ? x : ''; };
const fail = (slug: string): never => redirect(`/s/${slug}/exams?error=document-action` as never);
export async function uploadExamDocumentAction(fd: FormData) { const slug = v(fd,'schoolSlug'); try { const c = await contextForSchoolSlug(slug); const file = fd.get('file'); if (!(file instanceof File)) throw new Error('FILE_REQUIRED'); await uploadExamDocument(c, { examId:v(fd,'examId'), classId:v(fd,'classId') || undefined, subjectId:v(fd,'subjectId') || undefined, type:v(fd,'type') }, file, { originalName:file.name, contentType:file.type as never, sizeBytes:file.size }); } catch { fail(slug); } redirect(`/s/${slug}/exams/${v(fd,'examId')}/documents?message=uploaded` as never); }
export async function deleteExamDocumentAction(fd: FormData) { const slug = v(fd,'schoolSlug'); try { const c = await contextForSchoolSlug(slug); await deleteExamDocument(c, v(fd,'documentId')); } catch { fail(slug); } redirect(`/s/${slug}/exams/${v(fd,'examId')}/documents?message=deleted` as never); }
export async function downloadExamDocumentAction(fd: FormData) { const slug = v(fd,'schoolSlug'); try { const c = await contextForSchoolSlug(slug); const url = await getExamDocumentDownloadUrl(c, v(fd,'documentId')); redirect(url as never); } catch { fail(slug); } }
