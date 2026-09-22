import { z } from 'zod';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(v => new Date(`${v}T00:00:00.000Z`));
const id = z.string().uuid();
export const studentSchema = z.object({ admissionNumber: z.string().trim().min(1).max(80), firstName: z.string().trim().min(1).max(100), middleName: z.string().trim().max(100).optional(), lastName: z.string().trim().min(1).max(100), preferredName: z.string().trim().max(100).optional(), gender: z.string().trim().max(40).optional(), dateOfBirth: date, email: z.string().email().optional(), phone: z.string().trim().min(7).max(40).optional(), admissionDate: date, bloodGroup: z.string().trim().max(10).optional() });
export const guardianSchema = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), email: z.string().email().optional(), phone: z.string().trim().min(7).max(40), alternatePhone: z.string().trim().max(40).optional(), occupation: z.string().trim().max(120).optional(), address: z.string().trim().max(500).optional() });
export const guardianLinkSchema = z.object({ studentId: id, guardianId: id, relationship: z.string().trim().min(1).max(60), isPrimary: z.boolean().default(false), receivesNotifications: z.boolean().default(true), canPickup: z.boolean().default(false) });
export const enrollmentSchema = z.object({ studentId: id, academicYearId: id, classId: id, sectionId: id, rollNumber: z.string().trim().max(40).optional(), enrollmentDate: date });
export type StudentInput = z.infer<typeof studentSchema>;
