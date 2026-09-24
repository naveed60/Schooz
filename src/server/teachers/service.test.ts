import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createAssignment, getTeacher, listTeachers } from './service';
const context = { schoolId:'school-a', schoolSlug:'a', userId:'u', membershipId:'m', role:'SCHOOL_OWNER' as const, permissions:['teachers:read','teachers:manage'] as const };
const id = '00000000-0000-4000-8000-000000000001';
describe('teachers tenant boundaries', () => {
  it('scopes paginated teacher list to school', async () => { let args: { where: { schoolId: string }; skip: number; take: number } | undefined; const db = { teacher: { findMany: async (x: { where: { schoolId: string }; skip: number; take: number }) => { args = x; return []; } } } as never; await listTeachers(context, { page:2, pageSize:10 }, db); expect(args!.where.schoolId).toBe('school-a'); expect(args!.skip).toBe(10); });
  it('rejects cross-tenant assignment references', async () => { const db = { teacher:{findFirst:async()=>null}, academicYear:{findFirst:async()=>({})}, academicClass:{findFirst:async()=>({})}, section:{findFirst:async()=>true}, subject:{findFirst:async()=>({})}, classSubject:{findFirst:async()=>({})}, teacherAssignment:{create:vi.fn()} } as never; await expect(createAssignment(context,{teacherId:id,academicYearId:id,classId:id,subjectId:id},db)).rejects.toMatchObject({code:'NOT_FOUND'}); });
  it('does not resolve a teacher from another school', async () => { const db = { teacher:{findFirst:async()=>null} } as never; await expect(getTeacher(context,id,db)).rejects.toMatchObject({code:'NOT_FOUND'}); });
});
