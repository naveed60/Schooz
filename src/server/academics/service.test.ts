import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createClassSubject, createSection, listClassSubjects } from './service';

const context = { schoolId: 'school-a', schoolSlug: 'a', userId: 'user-a', membershipId: 'membership-a', role: 'SCHOOL_OWNER' as const, permissions: ['academics:read', 'academics:manage'] as const };
const ids = { year: '00000000-0000-4000-8000-000000000001', class: '00000000-0000-4000-8000-000000000002', subject: '00000000-0000-4000-8000-000000000003' };

describe('academic tenant scope', () => {
  it('rejects a section whose related records are outside the tenant', async () => {
    const db = { academicYear: { findFirst: async () => null }, academicClass: { findFirst: async () => ({ id: 'class-a' }) }, section: { create: vi.fn() } } as never;
    await expect(createSection(context, { academicYearId: ids.year, classId: ids.class, name: 'A' }, db)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('rejects a cross-tenant class subject mapping', async () => {
    const db = { academicYear: { findFirst: async () => ({ id: 'year-a' }) }, academicClass: { findFirst: async () => null }, subject: { findFirst: async () => ({ id: 'subject-a' }) }, classSubject: { create: vi.fn() } } as never;
    await expect(createClassSubject(context, { academicYearId: ids.year, classId: ids.class, subjectId: ids.subject }, db)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('loads class subjects with related data in one bounded query', async () => {
    let args: unknown;
    const db = { classSubject: { findMany: async (input: unknown) => { args = input; return []; } } } as never;
    await listClassSubjects(context, undefined, db);
    expect(args).toMatchObject({ where: { schoolId: 'school-a' }, include: { academicClass: { select: { name: true } }, subject: { select: { name: true, code: true } } } });
  });
});
