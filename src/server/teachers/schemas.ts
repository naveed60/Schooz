import { z } from 'zod';
const id = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(v => new Date(`${v}T00:00:00.000Z`));
export const teacherSchema = z.object({ employeeNumber: z.string().trim().min(1).max(80), firstName: z.string().trim().min(1).max(100), middleName: z.string().trim().max(100).optional(), lastName: z.string().trim().min(1).max(100), email: z.string().email().optional(), phone: z.string().trim().min(7).max(40).optional(), dateOfBirth: date.optional(), joinDate: date, qualification: z.string().trim().max(200).optional(), designation: z.string().trim().max(120).optional() });
export const teacherUpdateSchema = teacherSchema.omit({ employeeNumber: true }).partial();
export const assignmentSchema = z.object({ academicYearId: id, teacherId: id, classId: id, sectionId: id.optional(), subjectId: id });
export type TeacherStatus = 'ACTIVE' | 'INACTIVE';
