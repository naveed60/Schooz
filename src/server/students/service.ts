import 'server-only';
import { randomUUID } from 'node:crypto';
import { prisma } from '@schooz/database';
import { PERMISSIONS, requireSchoolPermission, type SchoolContext } from '../authorization';
import { ConflictError, NotFoundError } from '../errors';
import { createAuthorizedDownloadUrl, uploadPrivateObjectAtKey, validateUploadMetadata, type UploadMetadata } from '../storage';
import { enrollmentSchema, guardianLinkSchema, guardianSchema, studentCreateSchema, studentSchema, studentUpdateSchema } from './schemas';
import { assertEnrollmentStatusTransition, type EnrollmentStatus } from './state';

type StudentDb = Pick<typeof prisma, 'student' | 'guardian' | 'studentGuardian' | 'studentEnrollment' | 'academicYear' | 'academicClass' | 'section' | '$transaction'>;
const read = (c: SchoolContext) => requireSchoolPermission(c, PERMISSIONS.STUDENTS_READ);
const manage = (c: SchoolContext) => requireSchoolPermission(c, PERMISSIONS.STUDENTS_MANAGE);
const missing = (message: string): never => { throw new NotFoundError(message); };
function dbError(error: unknown): never { if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') throw new ConflictError('A matching student or relationship already exists.'); throw error; }

export async function listStudents(context: SchoolContext, filters: { query?: string; status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'; page?: number; pageSize?: number } = {}, db: StudentDb = prisma) {
  read(context); const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100); const page = Math.max(filters.page ?? 1, 1); const query = filters.query?.trim();
  return db.student.findMany({ where: { schoolId: context.schoolId, ...(filters.status ? { status: filters.status } : {}), ...(query ? { OR: [{ admissionNumber: { contains: query, mode: 'insensitive' } }, { firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }] } : {}) }, select: { id: true, admissionNumber: true, firstName: true, middleName: true, lastName: true, preferredName: true, status: true, admissionDate: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
}
export async function getStudent(context: SchoolContext, studentId: string, db: StudentDb = prisma) { read(context); const student = await db.student.findFirst({ where: { id: studentId, schoolId: context.schoolId }, include: { guardians: { include: { guardian: true } }, enrollments: { include: { academicYear: true, academicClass: true, section: true }, orderBy: { enrollmentDate: 'desc' } } } }); return student ?? missing('Student not found.'); }
export async function createStudent(context: SchoolContext, input: unknown, db: StudentDb = prisma) { manage(context); const data = studentSchema.parse(input); try { return await db.student.create({ data: { ...data, schoolId: context.schoolId } }); } catch (e) { dbError(e); } }
export async function archiveStudent(context: SchoolContext, studentId: string, db: StudentDb = prisma) { manage(context); const result = await db.student.updateMany({ where: { id: studentId, schoolId: context.schoolId }, data: { status: 'ARCHIVED', archivedAt: new Date() } }); if (!result.count) missing('Student not found.'); return result; }

export async function listGuardians(context: SchoolContext, query?: string, db: StudentDb = prisma) { read(context); return db.guardian.findMany({ where: { schoolId: context.schoolId, ...(query ? { OR: [{ firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }, { phone: { contains: query } }] } : {}) }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }], take: 100 }); }
export async function createGuardian(context: SchoolContext, input: unknown, db: StudentDb = prisma) { manage(context); const data = guardianSchema.parse(input); try { return await db.guardian.create({ data: { ...data, schoolId: context.schoolId } }); } catch (e) { dbError(e); } }
export async function linkGuardian(context: SchoolContext, input: unknown, db: StudentDb = prisma) { manage(context); const data = guardianLinkSchema.parse(input); const [student, guardian] = await Promise.all([db.student.findFirst({ where: { id: data.studentId, schoolId: context.schoolId } }), db.guardian.findFirst({ where: { id: data.guardianId, schoolId: context.schoolId } })]); if (!student || !guardian) missing('Student or guardian not found.'); try { return await db.studentGuardian.create({ data: { ...data, schoolId: context.schoolId } }); } catch (e) { dbError(e); } }

export async function createEnrollment(context: SchoolContext, input: unknown, db: StudentDb = prisma) { manage(context); const data = enrollmentSchema.parse(input); const [student, year, cls, section] = await Promise.all([db.student.findFirst({ where: { id: data.studentId, schoolId: context.schoolId } }), db.academicYear.findFirst({ where: { id: data.academicYearId, schoolId: context.schoolId } }), db.academicClass.findFirst({ where: { id: data.classId, schoolId: context.schoolId } }), db.section.findFirst({ where: { id: data.sectionId, schoolId: context.schoolId, academicYearId: data.academicYearId, classId: data.classId } })]); if (!student || !year || !cls || !section) missing('Enrollment records must belong to this school and matching academic structure.'); try { return await db.studentEnrollment.create({ data: { ...data, schoolId: context.schoolId } }); } catch (e) { dbError(e); } }
export async function setEnrollmentStatus(context: SchoolContext, enrollmentId: string, status: EnrollmentStatus, db: StudentDb = prisma) { manage(context); const current = await db.studentEnrollment.findFirst({ where: { id: enrollmentId, schoolId: context.schoolId } }); if (!current) return missing('Enrollment not found.'); assertEnrollmentStatusTransition(current.status, status); return db.studentEnrollment.update({ where: { id: enrollmentId }, data: { status } }); }
export async function uploadStudentPhoto(context: SchoolContext, studentId: string, file: Blob | ArrayBuffer | Uint8Array, metadata: UploadMetadata, db: StudentDb = prisma) { manage(context); const student = await db.student.findFirst({ where: { id: studentId, schoolId: context.schoolId } }); if (!student) missing('Student not found.'); const valid = validateUploadMetadata(metadata); if (!['image/jpeg', 'image/png', 'image/webp'].includes(valid.contentType)) throw new ConflictError('Student photos must be JPEG, PNG or WebP.'); const key = `schools/${context.schoolId}/students/${studentId}/${randomUUID()}`; const uploaded = await uploadPrivateObjectAtKey({ storageKey: key, allowedPrefix: `schools/${context.schoolId}/students/${studentId}`, file, metadata: valid }); await db.student.update({ where: { id: studentId }, data: { photoStorageKey: uploaded.storageKey } }); return uploaded; }
export async function getStudentPhotoUrl(context: SchoolContext, studentId: string, storage?: Parameters<typeof createAuthorizedDownloadUrl>[0]['storage'], db: StudentDb = prisma) { read(context); const student = await db.student.findFirst({ where: { id: studentId, schoolId: context.schoolId }, select: { photoStorageKey: true } }); if (!student?.photoStorageKey) return null; return createAuthorizedDownloadUrl({ context, schoolId: context.schoolId, storageKey: student.photoStorageKey, storage }); }
export async function updateStudent(context: SchoolContext, studentId: string, input: unknown, db: StudentDb = prisma) {
  manage(context); const data = studentUpdateSchema.parse(input);
  try {
    const result = await db.student.updateMany({ where: { id: studentId, schoolId: context.schoolId }, data });
    if (!result.count) missing('Student not found.');
    return db.student.findFirst({ where: { id: studentId, schoolId: context.schoolId } });
  } catch (e) { dbError(e); }
}
export async function createStudentWithInitialEnrollment(context: SchoolContext, input: unknown, db: StudentDb = prisma) {
  manage(context); const parsed = studentCreateSchema.parse(input); const { initialEnrollment, ...studentData } = parsed;
  try {
    return await db.$transaction(async tx => {
      const student = await tx.student.create({ data: { ...studentData, schoolId: context.schoolId } });
      if (!initialEnrollment) return student;
      const [year, cls, section] = await Promise.all([
        tx.academicYear.findFirst({ where: { id: initialEnrollment.academicYearId, schoolId: context.schoolId } }),
        tx.academicClass.findFirst({ where: { id: initialEnrollment.classId, schoolId: context.schoolId } }),
        tx.section.findFirst({ where: { id: initialEnrollment.sectionId, schoolId: context.schoolId, academicYearId: initialEnrollment.academicYearId, classId: initialEnrollment.classId } }),
      ]);
      if (!year || !cls || !section) missing('Initial enrollment records must belong to this school and matching academic structure.');
      await tx.studentEnrollment.create({ data: { ...initialEnrollment, studentId: student.id, schoolId: context.schoolId } });
      return student;
    });
  } catch (e) { dbError(e); }
}
export async function listStudentsFiltered(context: SchoolContext, filters: { query?: string; status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'; academicYearId?: string; classId?: string; sectionId?: string; page?: number; pageSize?: number } = {}, db: StudentDb = prisma) {
  read(context); const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100); const page = Math.max(filters.page ?? 1, 1); const query = filters.query?.trim();
  const enrollment = filters.academicYearId || filters.classId || filters.sectionId ? { enrollments: { some: { schoolId: context.schoolId, ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}), ...(filters.classId ? { classId: filters.classId } : {}), ...(filters.sectionId ? { sectionId: filters.sectionId } : {}) } } } : {};
  const items = await db.student.findMany({ where: { schoolId: context.schoolId, ...enrollment, ...(filters.status ? { status: filters.status } : {}), ...(query ? { OR: [{ admissionNumber: { contains: query, mode: 'insensitive' } }, { firstName: { contains: query, mode: 'insensitive' } }, { middleName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }] } : {}) }, select: { id: true, admissionNumber: true, firstName: true, middleName: true, lastName: true, preferredName: true, status: true, admissionDate: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize });
  return { items, page, pageSize, hasMore: items.length === pageSize };
}
export async function listGuardiansPage(context: SchoolContext, filters: { query?: string; page?: number; pageSize?: number } = {}, db: StudentDb = prisma) {
  read(context); const pageSize = Math.min(Math.max(filters.pageSize ?? 25, 1), 100); const page = Math.max(filters.page ?? 1, 1); const query = filters.query?.trim();
  const items = await db.guardian.findMany({ where: { schoolId: context.schoolId, ...(query ? { OR: [{ firstName: { contains: query, mode: 'insensitive' } }, { lastName: { contains: query, mode: 'insensitive' } }, { phone: { contains: query } }] } : {}) }, select: { id: true, firstName: true, lastName: true, email: true, phone: true, alternatePhone: true }, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }], skip: (page - 1) * pageSize, take: pageSize });
  return { items, page, pageSize, hasMore: items.length === pageSize };
}
export async function getGuardian(context: SchoolContext, guardianId: string, db: StudentDb = prisma) {
  read(context); const guardian = await db.guardian.findFirst({ where: { id: guardianId, schoolId: context.schoolId }, include: { students: { take: 100, include: { student: { select: { id: true, admissionNumber: true, firstName: true, lastName: true, status: true } } } } } });
  return guardian ?? missing('Guardian not found.');
}
export async function listClassRoster(context: SchoolContext, filters: { academicYearId: string; classId: string; sectionId?: string; page?: number; pageSize?: number }, db: StudentDb = prisma) {
  read(context); const pageSize = Math.min(Math.max(filters.pageSize ?? 100, 1), 200); const page = Math.max(filters.page ?? 1, 1);
  const [year, cls, section] = await Promise.all([db.academicYear.findFirst({ where: { id: filters.academicYearId, schoolId: context.schoolId } }), db.academicClass.findFirst({ where: { id: filters.classId, schoolId: context.schoolId } }), filters.sectionId ? db.section.findFirst({ where: { id: filters.sectionId, schoolId: context.schoolId, academicYearId: filters.academicYearId, classId: filters.classId } }) : Promise.resolve(true)]);
  if (!year || !cls || !section) missing('Roster records must belong to this school and matching academic structure.');
  return db.studentEnrollment.findMany({ where: { schoolId: context.schoolId, academicYearId: filters.academicYearId, classId: filters.classId, ...(filters.sectionId ? { sectionId: filters.sectionId } : {}), status: 'ACTIVE' }, select: { id: true, rollNumber: true, status: true, student: { select: { id: true, admissionNumber: true, firstName: true, middleName: true, lastName: true, preferredName: true } } }, orderBy: [{ rollNumber: 'asc' }, { student: { lastName: 'asc' } }], skip: (page - 1) * pageSize, take: pageSize });
}
export async function getStudentBounded(context: SchoolContext, studentId: string, db: StudentDb = prisma) {
  read(context); const student = await db.student.findFirst({ where: { id: studentId, schoolId: context.schoolId }, include: { guardians: { take: 100, include: { guardian: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, alternatePhone: true } } } }, enrollments: { take: 100, include: { academicYear: { select: { id: true, name: true } }, academicClass: { select: { id: true, name: true } }, section: { select: { id: true, name: true } } }, orderBy: { enrollmentDate: 'desc' } } } });
  return student ?? missing('Student not found.');
}
