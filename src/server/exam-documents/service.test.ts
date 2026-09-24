import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { getExamDocumentDownloadUrl, listExamDocuments, uploadExamDocument } from './service';
const base = { schoolId:'school-a', schoolSlug:'a', userId:'user-a', membershipId:'m', role:'SCHOOL_OWNER' as const };
const read = { ...base, permissions:['exams:read'] as const };
const manage = { ...base, permissions:['exams:read','exams:manage'] as const };
const id = '00000000-0000-4000-8000-000000000001';
const exam = { id, academicYearId:id, startDate:new Date('2026-01-01'), endDate:new Date('2026-01-31') };
describe('exam document security', () => {
  it('does not list another tenant document', async () => { const db = { exam:{findFirst:async()=>null}, examDocument:{findMany:vi.fn()} } as never; await expect(listExamDocuments(read,id,db)).rejects.toMatchObject({code:'NOT_FOUND'}); expect((db as { examDocument: { findMany: ReturnType<typeof vi.fn> } }).examDocument.findMany).not.toHaveBeenCalled(); });
  it('requires stronger permission for answer keys', async () => { const db = { examDocument:{findFirst:async()=>({ id, examId:id, type:'ANSWER_KEY', storageKey:`schools/school-a/exams/${id}/opaque.pdf` })} } as never; await expect(getExamDocumentDownloadUrl(read,id,undefined,db)).rejects.toMatchObject({code:'SCHOOL_PERMISSION_REQUIRED'}); });
  it('rejects mismatched extensions before storage upload', async () => { const db = { exam:{findFirst:async()=>exam} } as never; await expect(uploadExamDocument(manage,{examId:id,type:'SYLLABUS'},new Uint8Array([37,80,68,70]),{originalName:'paper.png',contentType:'application/pdf',sizeBytes:4},db)).rejects.toThrow('extension'); });
});
