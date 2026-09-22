import { z } from 'zod';

const id = z.string().uuid();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.').transform(value => new Date(`${value}T00:00:00.000Z`));

export const academicYearSchema = z.object({
  name: z.string().trim().min(1).max(120),
  startDate: date,
  endDate: date,
}).superRefine((value, ctx) => {
  if (value.endDate <= value.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be after start date.' });
});

export const academicClassSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.preprocess(value => typeof value === 'string' && !value.trim() ? undefined : value, z.string().trim().max(40).optional()),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
});

export const subjectSchema = z.object({ name: z.string().trim().min(1).max(120), code: z.string().trim().min(1).max(40) });
export const sectionSchema = z.object({ academicYearId: id, classId: id, name: z.string().trim().min(1).max(80), capacity: z.coerce.number().int().positive().optional() });
export const classSubjectSchema = z.object({ academicYearId: id, classId: id, subjectId: id, maxMarks: z.coerce.number().nonnegative().optional(), passMarks: z.coerce.number().nonnegative().optional() }).superRefine((value, ctx) => {
  if (value.maxMarks !== undefined && value.passMarks !== undefined && value.passMarks > value.maxMarks) ctx.addIssue({ code: 'custom', path: ['passMarks'], message: 'Pass marks cannot exceed max marks.' });
});

export type AcademicYearInput = z.infer<typeof academicYearSchema>;
