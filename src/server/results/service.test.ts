import { vi, describe, expect, it } from 'vitest';
vi.mock('server-only', () => ({}));
import { saveClassMarks } from './service';

const context = { schoolId: 'school-a', schoolSlug: 'a', userId: 'user-a', membershipId: 'membership-a', role: 'SCHOOL_OWNER' as const, permissions: ['results:manage', 'exams:read'] as const };
const examId = '00000000-0000-4000-8000-000000000001';
const classId = '00000000-0000-4000-8000-000000000002';
const subjectId = '00000000-0000-4000-8000-000000000003';
const studentId = '00000000-0000-4000-8000-000000000004';
const enrollmentId = '00000000-0000-4000-8000-000000000005';

describe('marks service', () => {
  it('rejects a cross-tenant exam before reading enrollments', async () => {
    const db = { exam: { findFirst: vi.fn().mockResolvedValue(null) } } as never;
    await expect(saveClassMarks(context, { examId, classId, subjectId, entries: [{ studentId, enrollmentId, marksObtained: 10 }] }, db)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('uses scheduled max marks and batches the upserts', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const db = {
      exam: { findFirst: vi.fn().mockResolvedValue({ id: examId, schoolId: 'school-a', academicYearId: 'year-a' }) },
      examSchedule: { findFirst: vi.fn().mockResolvedValue({ maxMarks: 20, passMarks: 8 }) },
      studentEnrollment: { findMany: vi.fn().mockResolvedValue([{ id: enrollmentId, studentId }]) },
      studentMark: { upsert },
      $transaction: vi.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
    } as never;
    await saveClassMarks(context, { examId, classId, subjectId, status: 'SUBMITTED', entries: [{ studentId, enrollmentId, marksObtained: 19 }] }, db);
    expect(upsert).toHaveBeenCalledOnce();
    expect(upsert.mock.calls[0][0].create.maxMarks).toBe(20);
    expect(upsert.mock.calls[0][0].create.status).toBe('SUBMITTED');
  });
});
